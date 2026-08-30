/**
 * Local-First IndexedDB Persistence Layer for SIH 26154:
 * "Gen AI Platform for Automated Content Transformation".
 *
 * Stores Projects, Generations, and Deliverable Edits completely in-browser
 * without external database dependencies or cloud telemetry.
 */

import {
  ProjectRecord,
  GenerationRecord,
  ProjectDraft,
  TransformationConfig,
  GeneratedDeliverable,
  SerializableSourceMetadata,
} from "../types";

const DB_NAME = "sih_content_transformation_db";
const DB_VERSION = 1;

const STORES = {
  PROJECTS: "projects",
  GENERATIONS: "generations",
} as const;

// In-Memory fallback store for environments where IndexedDB is restricted or disabled
const memoryStore = {
  projects: new Map<string, ProjectRecord>(),
  generations: new Map<string, GenerationRecord>(),
};

let dbInstance: IDBDatabase | null = null;
let isIndexedDbAvailable = true;

/**
 * Initializes and connects to the IndexedDB database.
 */
export async function getDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    isIndexedDbAvailable = false;
    return null;
  }

  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Projects Store
        if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
          const projectStore = db.createObjectStore(STORES.PROJECTS, { keyPath: "id" });
          projectStore.createIndex("updatedAt", "updatedAt", { unique: false });
          projectStore.createIndex("name", "name", { unique: false });
        }

        // 2. Generations Store
        if (!db.objectStoreNames.contains(STORES.GENERATIONS)) {
          const genStore = db.createObjectStore(STORES.GENERATIONS, { keyPath: "id" });
          genStore.createIndex("projectId", "projectId", { unique: false });
          genStore.createIndex("createdAt", "createdAt", { unique: false });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        resolve(dbInstance);
      };

      request.onerror = (event) => {
        console.warn("[LocalDB] IndexedDB open error, falling back to memory:", event);
        isIndexedDbAvailable = false;
        resolve(null);
      };

      request.onblocked = () => {
        console.warn("[LocalDB] IndexedDB open blocked");
      };
    } catch (e) {
      console.warn("[LocalDB] Exception opening IndexedDB:", e);
      isIndexedDbAvailable = false;
      resolve(null);
    }
  });
}

/**
 * Helper to strip non-serializable properties (e.g. raw DOM File objects) from ProjectDraft
 */
export function sanitizeDraftForStorage(draft: ProjectDraft): ProjectDraft {
  return {
    name: draft.name || "Untitled Project",
    sourceType: draft.sourceType || "text",
    sourceFile: draft.sourceFile
      ? {
          file: undefined as any, // File object is not serializable
          name: draft.sourceFile.name,
          size: draft.sourceFile.size,
          type: draft.sourceFile.type,
          formattedSize: draft.sourceFile.formattedSize,
          category: draft.sourceFile.category,
        }
      : null,
    sourceText: draft.sourceText || "",
    charCount: draft.charCount || 0,
    wordCount: draft.wordCount || 0,
    isReady: draft.isReady,
  };
}

/**
 * Creates serializable source metadata summary for a project.
 */
export function extractSourceMetadata(draft: ProjectDraft): SerializableSourceMetadata {
  const text = draft.sourceText || "";
  const excerpt = text.length > 220 ? `${text.substring(0, 220).trim()}...` : text.trim();

  return {
    fileName: draft.sourceFile?.name,
    fileSize: draft.sourceFile?.size,
    formattedSize: draft.sourceFile?.formattedSize,
    fileCategory: draft.sourceFile?.category,
    charCount: draft.charCount || text.length,
    wordCount: draft.wordCount || text.trim().split(/\s+/).filter(Boolean).length,
    excerpt,
  };
}

// ==========================================
// PROJECTS API
// ==========================================

/**
 * Retrieves all stored projects, sorted by updatedAt descending.
 */
export async function getAllProjects(): Promise<ProjectRecord[]> {
  const db = await getDatabase();

  if (!db || !isIndexedDbAvailable) {
    const list = Array.from(memoryStore.projects.values());
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.PROJECTS, "readonly");
      const store = tx.objectStore(STORES.PROJECTS);
      const request = store.getAll();

      request.onsuccess = () => {
        const rawRecords: ProjectRecord[] = request.result || [];
        // Distinct map by ID to eliminate any duplicate IDs
        const distinctMap = new Map<string, ProjectRecord>();
        for (const rec of rawRecords) {
          if (!distinctMap.has(rec.id) || new Date(rec.updatedAt).getTime() > new Date(distinctMap.get(rec.id)!.updatedAt).getTime()) {
            distinctMap.set(rec.id, rec);
          }
        }
        const records = Array.from(distinctMap.values());
        records.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        resolve(records);
      };

      request.onerror = () => {
        console.error("[LocalDB] Failed to load projects from IndexedDB");
        resolve(Array.from(memoryStore.projects.values()));
      };
    } catch (err) {
      console.error("[LocalDB] getAllProjects transaction error:", err);
      resolve(Array.from(memoryStore.projects.values()));
    }
  });
}

/**
 * Retrieves a single project by ID.
 */
export async function getProject(projectId: string): Promise<ProjectRecord | null> {
  if (!projectId) return null;
  const db = await getDatabase();

  if (!db || !isIndexedDbAvailable) {
    return memoryStore.projects.get(projectId) || null;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.PROJECTS, "readonly");
      const store = tx.objectStore(STORES.PROJECTS);
      const request = store.get(projectId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(memoryStore.projects.get(projectId) || null);
      };
    } catch (err) {
      resolve(memoryStore.projects.get(projectId) || null);
    }
  });
}

/**
 * Saves or updates a project record.
 */
export async function saveProject(project: ProjectRecord): Promise<ProjectRecord> {
  const cleanProject: ProjectRecord = {
    ...project,
    draft: sanitizeDraftForStorage(project.draft),
    updatedAt: new Date().toISOString(),
  };

  // Always keep in-memory fallback in sync
  memoryStore.projects.set(cleanProject.id, cleanProject);

  const db = await getDatabase();
  if (!db || !isIndexedDbAvailable) {
    return cleanProject;
  }

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.PROJECTS, "readwrite");
      const store = tx.objectStore(STORES.PROJECTS);
      const request = store.put(cleanProject);

      request.onsuccess = () => {
        resolve(cleanProject);
      };

      request.onerror = (e) => {
        console.error("[LocalDB] Failed to save project to IndexedDB:", e);
        resolve(cleanProject);
      };
    } catch (err) {
      console.error("[LocalDB] saveProject error:", err);
      resolve(cleanProject);
    }
  });
}

/**
 * Renames a project and updates associated generation records with the new project name.
 */
export async function renameProject(projectId: string, newName: string): Promise<ProjectRecord | null> {
  if (!projectId || !newName || !newName.trim()) return null;
  const project = await getProject(projectId);
  if (!project) return null;

  const trimmedName = newName.trim();
  const updatedProject: ProjectRecord = {
    ...project,
    name: trimmedName,
    draft: {
      ...project.draft,
      name: trimmedName,
    },
    updatedAt: new Date().toISOString(),
  };

  await saveProject(updatedProject);

  // Sync project name to in-memory and persisted generations for this project
  const gens = await getGenerationsForProject(projectId);
  for (const gen of gens) {
    const updatedGen: GenerationRecord = {
      ...gen,
      projectName: trimmedName,
    };
    memoryStore.generations.set(gen.id, updatedGen);
  }

  const db = await getDatabase();
  if (db && isIndexedDbAvailable) {
    try {
      const tx = db.transaction(STORES.GENERATIONS, "readwrite");
      const store = tx.objectStore(STORES.GENERATIONS);
      for (const gen of gens) {
        store.put({ ...gen, projectName: trimmedName });
      }
    } catch (err) {
      console.warn("[LocalDB] renameProject generation update warning:", err);
    }
  }

  return updatedProject;
}

/**
 * Deletes a project and all its associated generations.
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  if (!projectId) return false;

  memoryStore.projects.delete(projectId);
  for (const [genId, gen] of memoryStore.generations.entries()) {
    if (gen.projectId === projectId) {
      memoryStore.generations.delete(genId);
    }
  }

  const db = await getDatabase();
  if (!db || !isIndexedDbAvailable) {
    return true;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORES.PROJECTS, STORES.GENERATIONS], "readwrite");
      const projectStore = tx.objectStore(STORES.PROJECTS);
      const genStore = tx.objectStore(STORES.GENERATIONS);

      projectStore.delete(projectId);

      const genIndex = genStore.index("projectId");
      const genReq = genIndex.getAllKeys(projectId);

      genReq.onsuccess = () => {
        const keys = genReq.result || [];
        keys.forEach((key) => genStore.delete(key));
      };

      tx.oncomplete = () => {
        resolve(true);
      };

      tx.onerror = () => {
        resolve(false);
      };
    } catch (err) {
      console.error("[LocalDB] deleteProject error:", err);
      resolve(false);
    }
  });
}

// ==========================================
// GENERATIONS API
// ==========================================

/**
 * Retrieves all generations for a specific project, sorted newest first.
 */
export async function getGenerationsForProject(projectId: string): Promise<GenerationRecord[]> {
  if (!projectId) return [];
  const db = await getDatabase();

  if (!db || !isIndexedDbAvailable) {
    const list = Array.from(memoryStore.generations.values()).filter((g) => g.projectId === projectId);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.GENERATIONS, "readonly");
      const store = tx.objectStore(STORES.GENERATIONS);
      const index = store.index("projectId");
      const request = index.getAll(projectId);

      request.onsuccess = () => {
        const list: GenerationRecord[] = request.result || [];
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(list);
      };

      request.onerror = () => {
        const list = Array.from(memoryStore.generations.values()).filter((g) => g.projectId === projectId);
        resolve(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      };
    } catch (err) {
      const list = Array.from(memoryStore.generations.values()).filter((g) => g.projectId === projectId);
      resolve(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
  });
}

/**
 * Retrieves a single generation record by its ID.
 */
export async function getGeneration(generationId: string): Promise<GenerationRecord | null> {
  if (!generationId) return null;
  const db = await getDatabase();

  if (!db || !isIndexedDbAvailable) {
    return memoryStore.generations.get(generationId) || null;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.GENERATIONS, "readonly");
      const store = tx.objectStore(STORES.GENERATIONS);
      const request = store.get(generationId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(memoryStore.generations.get(generationId) || null);
      };
    } catch (err) {
      resolve(memoryStore.generations.get(generationId) || null);
    }
  });
}

// In-flight mutex locks for atomic idempotency
const inFlightSaveLocks = new Map<string, Promise<{ project: ProjectRecord; generation: GenerationRecord }>>();

/**
 * Persists a completed generation and automatically updates or creates its associated Project record.
 * Fully atomic, idempotent, and duplicate-safe.
 */
export async function saveGenerationAndSyncProject(
  draft: ProjectDraft,
  config: TransformationConfig,
  deliverables: GeneratedDeliverable[],
  options?: {
    projectId?: string;
    generationId?: string;
    modelUsed?: string;
    error?: string | null;
  }
): Promise<{ project: ProjectRecord; generation: GenerationRecord }> {
  // Deterministic lock key to prevent concurrent double-submission race conditions
  const lockKey = `${options?.projectId || "new"}_${options?.generationId || "new"}_${draft.name || ""}`;
  const existingLock = inFlightSaveLocks.get(lockKey);
  if (existingLock) {
    return existingLock;
  }

  const savePromise = (async () => {
    const now = new Date().toISOString();
    const sanitizedDraft = sanitizeDraftForStorage(draft);
    const sourceMetadata = extractSourceMetadata(sanitizedDraft);

    // 1. Resolve or Create Project ID
    let projectId = options?.projectId;
    let existingProject: ProjectRecord | null = null;

    if (projectId) {
      existingProject = await getProject(projectId);
    }

    if (!existingProject) {
      // Generate stable project ID if none exists
      projectId = projectId || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      existingProject = {
        id: projectId,
        name: sanitizedDraft.name || "Untitled Transformation Project",
        createdAt: now,
        updatedAt: now,
        latestGenerationId: null,
        sourceType: sanitizedDraft.sourceType,
        sourceText: sanitizedDraft.sourceText,
        sourceMetadata,
        draft: sanitizedDraft,
        generationCount: 0,
        deliverableCount: deliverables.length,
        status: "completed",
      };
    }

    // 2. Fetch existing generations for this project
    const currentGenerations = await getGenerationsForProject(existingProject.id);

    // 3. Resolve Generation ID & determine if this is an update vs new creation
    const generationId =
      options?.generationId || `gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const existingGeneration = await getGeneration(generationId);

    const completedDeliverablesCount = deliverables.filter((d) => d.status === "completed").length;
    const genStatus =
      completedDeliverablesCount === deliverables.length
        ? "completed"
        : completedDeliverablesCount > 0
        ? "partial"
        : "failed";

    let generationRecord: GenerationRecord;
    let totalProjectGenerations = currentGenerations.length;

    if (existingGeneration) {
      // UPDATE SEMANTICS: In-place update of existing generation
      generationRecord = {
        ...existingGeneration,
        projectName: sanitizedDraft.name || existingProject.name,
        completedAt: now,
        status: genStatus,
        modelUsed: options?.modelUsed || existingGeneration.modelUsed || "gemini-3.7-flash",
        config,
        draft: sanitizedDraft,
        deliverables,
        deliverableCount: deliverables.length,
        error: options?.error !== undefined ? options.error : existingGeneration.error,
      };
    } else {
      // CREATE SEMANTICS: New generation record
      const otherGens = currentGenerations.filter((g) => g.id !== generationId);
      const generationNumber = otherGens.length + 1;
      totalProjectGenerations = generationNumber;

      generationRecord = {
        id: generationId,
        projectId: existingProject.id,
        projectName: sanitizedDraft.name || existingProject.name,
        generationNumber,
        createdAt: now,
        completedAt: now,
        status: genStatus,
        modelUsed: options?.modelUsed || "gemini-3.7-flash",
        config,
        draft: sanitizedDraft,
        deliverables,
        deliverableCount: deliverables.length,
        error: options?.error || null,
      };
    }

    // 4. Update Parent Project Record
    const updatedProject: ProjectRecord = {
      ...existingProject,
      name: sanitizedDraft.name || existingProject.name,
      updatedAt: now,
      latestGenerationId: generationId,
      sourceText: sanitizedDraft.sourceText || existingProject.sourceText,
      sourceMetadata,
      draft: sanitizedDraft,
      generationCount: Math.max(existingProject.generationCount || 0, totalProjectGenerations, 1),
      deliverableCount: deliverables.length,
      status: genStatus === "completed" ? "completed" : "in_progress",
    };

    // 5. Atomic write to memoryStore
    memoryStore.generations.set(generationRecord.id, generationRecord);
    memoryStore.projects.set(updatedProject.id, updatedProject);

    // 6. Atomic write to IndexedDB
    const db = await getDatabase();
    if (db && isIndexedDbAvailable) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction([STORES.PROJECTS, STORES.GENERATIONS], "readwrite");
          tx.objectStore(STORES.PROJECTS).put(updatedProject);
          tx.objectStore(STORES.GENERATIONS).put(generationRecord);
          tx.oncomplete = () => resolve();
          tx.onerror = (e) => {
            console.error("[LocalDB] saveGenerationAndSyncProject transaction error:", e);
            resolve();
          };
        } catch (err) {
          console.error("[LocalDB] saveGenerationAndSyncProject transaction exception:", err);
          resolve();
        }
      });
    }

    return { project: updatedProject, generation: generationRecord };
  })();

  inFlightSaveLocks.set(lockKey, savePromise);

  try {
    const result = await savePromise;
    return result;
  } finally {
    inFlightSaveLocks.delete(lockKey);
  }
}

/**
 * Updates a single deliverable's content or state inside a stored generation.
 */
export async function updateDeliverableInGeneration(
  generationId: string,
  deliverableId: string,
  updatedContent: string
): Promise<GenerationRecord | null> {
  const gen = await getGeneration(generationId);
  if (!gen) return null;

  const now = new Date().toISOString();
  const updatedDeliverables = gen.deliverables.map((d) => {
    if (d.deliverableId === deliverableId) {
      return {
        ...d,
        content: updatedContent,
        isEdited: true,
        originalContent: d.originalContent !== undefined ? d.originalContent : d.content,
        lastEditedAt: now,
      };
    }
    return d;
  });

  const updatedGen: GenerationRecord = {
    ...gen,
    deliverables: updatedDeliverables,
  };

  memoryStore.generations.set(updatedGen.id, updatedGen);

  const db = await getDatabase();
  if (db && isIndexedDbAvailable) {
    try {
      const tx = db.transaction(STORES.GENERATIONS, "readwrite");
      tx.objectStore(STORES.GENERATIONS).put(updatedGen);
    } catch (err) {
      console.error("[LocalDB] updateDeliverableInGeneration error:", err);
    }
  }

  return updatedGen;
}

/**
 * Resets an edited deliverable back to its original AI-generated version inside a stored generation.
 */
export async function resetDeliverableInGeneration(
  generationId: string,
  deliverableId: string
): Promise<GenerationRecord | null> {
  const gen = await getGeneration(generationId);
  if (!gen) return null;

  const updatedDeliverables = gen.deliverables.map((d) => {
    if (d.deliverableId === deliverableId) {
      return {
        ...d,
        content: d.originalContent !== undefined ? d.originalContent : d.content,
        isEdited: false,
        lastEditedAt: undefined,
      };
    }
    return d;
  });

  const updatedGen: GenerationRecord = {
    ...gen,
    deliverables: updatedDeliverables,
  };

  memoryStore.generations.set(updatedGen.id, updatedGen);

  const db = await getDatabase();
  if (db && isIndexedDbAvailable) {
    try {
      const tx = db.transaction(STORES.GENERATIONS, "readwrite");
      tx.objectStore(STORES.GENERATIONS).put(updatedGen);
    } catch (err) {
      console.error("[LocalDB] resetDeliverableInGeneration error:", err);
    }
  }

  return updatedGen;
}

/**
 * Retrieves all stored generations across all projects, sorted newest first.
 */
export async function getAllGenerations(): Promise<GenerationRecord[]> {
  const db = await getDatabase();

  if (!db || !isIndexedDbAvailable) {
    const list = Array.from(memoryStore.generations.values());
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.GENERATIONS, "readonly");
      const store = tx.objectStore(STORES.GENERATIONS);
      const request = store.getAll();

      request.onsuccess = () => {
        const rawRecords: GenerationRecord[] = request.result || [];
        const distinctMap = new Map<string, GenerationRecord>();
        for (const rec of rawRecords) {
          if (!distinctMap.has(rec.id) || new Date(rec.completedAt || rec.createdAt).getTime() > new Date(distinctMap.get(rec.id)!.completedAt || distinctMap.get(rec.id)!.createdAt).getTime()) {
            distinctMap.set(rec.id, rec);
          }
        }
        const records = Array.from(distinctMap.values());
        records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(records);
      };

      request.onerror = () => {
        const list = Array.from(memoryStore.generations.values());
        resolve(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      };
    } catch (err) {
      console.error("[LocalDB] getAllGenerations transaction error:", err);
      const list = Array.from(memoryStore.generations.values());
      resolve(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
  });
}

/**
 * Deletes a single generation record and syncs its parent project metadata.
 */
export async function deleteGeneration(generationId: string): Promise<boolean> {
  if (!generationId) return false;

  const targetGen = await getGeneration(generationId);
  if (!targetGen) return false;

  const projectId = targetGen.projectId;

  // 1. Remove from memory store
  memoryStore.generations.delete(generationId);

  // 2. Remove from IndexedDB
  const db = await getDatabase();
  if (db && isIndexedDbAvailable) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORES.GENERATIONS, "readwrite");
        const store = tx.objectStore(STORES.GENERATIONS);
        const req = store.delete(generationId);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // 3. Update associated project's latest generation reference and count
  if (projectId) {
    const remainingGenerations = await getGenerationsForProject(projectId);
    const existingProject = await getProject(projectId);

    if (existingProject) {
      const now = new Date().toISOString();
      const updatedProject: ProjectRecord = {
        ...existingProject,
        generationCount: remainingGenerations.length,
        latestGenerationId: remainingGenerations.length > 0 ? remainingGenerations[0].id : null,
        deliverableCount: remainingGenerations.length > 0 ? remainingGenerations[0].deliverableCount : 0,
        status: remainingGenerations.length > 0 ? existingProject.status : "draft",
        updatedAt: now,
      };

      await saveProject(updatedProject);
    }
  }

  return true;
}

export interface HistoryStats {
  totalProjects: number;
  totalGenerations: number;
  totalDeliverables: number;
  lastActivity: string | null;
}

/**
 * Computes live transformation history stats directly from IndexedDB.
 */
export async function getHistoryStats(): Promise<HistoryStats> {
  const [projects, generations] = await Promise.all([
    getAllProjects(),
    getAllGenerations(),
  ]);

  let totalDeliverables = 0;
  for (const gen of generations) {
    totalDeliverables += gen.deliverables?.length || gen.deliverableCount || 0;
  }

  let latestTimestamp: number | null = null;
  for (const p of projects) {
    const t = new Date(p.updatedAt || p.createdAt).getTime();
    if (!isNaN(t) && (latestTimestamp === null || t > latestTimestamp)) {
      latestTimestamp = t;
    }
  }
  for (const g of generations) {
    const t = new Date(g.completedAt || g.createdAt).getTime();
    if (!isNaN(t) && (latestTimestamp === null || t > latestTimestamp)) {
      latestTimestamp = t;
    }
  }

  return {
    totalProjects: projects.length,
    totalGenerations: generations.length,
    totalDeliverables,
    lastActivity: latestTimestamp ? new Date(latestTimestamp).toISOString() : null,
  };
}
