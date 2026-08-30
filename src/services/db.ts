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
        const records: ProjectRecord[] = request.result || [];
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

/**
 * Persists a completed generation and automatically updates or creates its associated Project record.
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
    // Generate stable project ID
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

  // 2. Fetch current generation count for this project
  const currentGenerations = await getGenerationsForProject(existingProject.id);
  const generationNumber = currentGenerations.length + 1;

  // 3. Construct Generation Record
  const generationId =
    options?.generationId || `gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const completedDeliverablesCount = deliverables.filter((d) => d.status === "completed").length;
  const genStatus =
    completedDeliverablesCount === deliverables.length
      ? "completed"
      : completedDeliverablesCount > 0
      ? "partial"
      : "failed";

  const generationRecord: GenerationRecord = {
    id: generationId,
    projectId: existingProject.id,
    projectName: existingProject.name,
    generationNumber,
    createdAt: now,
    completedAt: now,
    status: genStatus,
    modelUsed: options?.modelUsed || "gemini-3.6-flash",
    config,
    draft: sanitizedDraft,
    deliverables,
    deliverableCount: deliverables.length,
    error: options?.error || null,
  };

  // 4. Update Project Record
  const updatedProject: ProjectRecord = {
    ...existingProject,
    name: sanitizedDraft.name || existingProject.name,
    updatedAt: now,
    latestGenerationId: generationId,
    sourceText: sanitizedDraft.sourceText || existingProject.sourceText,
    sourceMetadata,
    draft: sanitizedDraft,
    generationCount: generationNumber,
    deliverableCount: deliverables.length,
    status: genStatus === "completed" ? "completed" : "in_progress",
  };

  // 5. Store both to IndexedDB & Memory
  memoryStore.generations.set(generationRecord.id, generationRecord);
  memoryStore.projects.set(updatedProject.id, updatedProject);

  const db = await getDatabase();
  if (db && isIndexedDbAvailable) {
    try {
      const tx = db.transaction([STORES.PROJECTS, STORES.GENERATIONS], "readwrite");
      tx.objectStore(STORES.PROJECTS).put(updatedProject);
      tx.objectStore(STORES.GENERATIONS).put(generationRecord);
    } catch (err) {
      console.error("[LocalDB] saveGenerationAndSyncProject transaction error:", err);
    }
  }

  return { project: updatedProject, generation: generationRecord };
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
