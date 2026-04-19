import { supabase } from "@/src/lib/supabase";
import type {
  DocumentWorkspace,
  SourceDocument,
  StudyPack,
} from "@/src/types/app";

function mapSourceDocument(row: Record<string, unknown>): SourceDocument {
  return {
    id: String(row.id),
    user_id: typeof row.user_id === "string" ? row.user_id : null,
    title:
      typeof row.title === "string"
        ? row.title
        : typeof row.name === "string"
          ? row.name
          : typeof row.file_name === "string"
            ? row.file_name
            : "Untitled document",
    file_name:
      typeof row.file_name === "string"
        ? row.file_name
        : typeof row.original_filename === "string"
          ? row.original_filename
          : null,
    file_type:
      typeof row.file_type === "string"
        ? row.file_type
        : typeof row.mime_type === "string"
          ? row.mime_type
          : null,
    storage_path:
      typeof row.storage_path === "string"
        ? row.storage_path
        : typeof row.file_path === "string"
          ? row.file_path
          : typeof row.object_path === "string"
            ? row.object_path
            : null,
    status:
      typeof row.status === "string"
        ? row.status
        : typeof row.processing_status === "string"
          ? row.processing_status
          : null,
    created_at: typeof row.created_at === "string" ? row.created_at : null,
  };
}

function mapStudyPack(row: Record<string, unknown>): StudyPack {
  return {
    id: String(row.id),
    document_id:
      typeof row.document_id === "string"
        ? row.document_id
        : typeof row.source_document_id === "string"
          ? row.source_document_id
          : null,
    overview:
      typeof row.overview === "string"
        ? row.overview
        : typeof row.summary === "string"
          ? row.summary
          : null,
    status: typeof row.status === "string" ? row.status : null,
    created_at: typeof row.created_at === "string" ? row.created_at : null,
  };
}

async function requireUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message || "Could not read the current user.");
  }

  if (!user) {
    throw new Error("You must be signed in to load documents.");
  }

  return user.id;
}

export async function getMyDocuments(): Promise<SourceDocument[]> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("source_documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Could not load your documents.");
  }

  return (data ?? []).map((row) =>
    mapSourceDocument(row as Record<string, unknown>),
  );
}

async function getFlashcardsCount(documentId: string, studyPackId?: string | null) {
  if (studyPackId) {
    const byStudyPack = await supabase
      .from("flashcards")
      .select("id", { count: "exact", head: true })
      .eq("study_pack_id", studyPackId);

    if (!byStudyPack.error) {
      return byStudyPack.count ?? 0;
    }
  }

  const byDocument = await supabase
    .from("flashcards")
    .select("id", { count: "exact", head: true })
    .eq("document_id", documentId);

  if (byDocument.error) {
    throw new Error(byDocument.error.message || "Could not count flashcards.");
  }

  return byDocument.count ?? 0;
}

export async function getDocumentWorkspace(
  documentId: string,
): Promise<DocumentWorkspace> {
  const userId = await requireUserId();

  const { data: documentRow, error: documentError } = await supabase
    .from("source_documents")
    .select("*")
    .eq("id", documentId)
    .eq("user_id", userId)
    .single();

  if (documentError) {
    throw new Error(documentError.message || "Could not load this document.");
  }

  const { data: studyPackRow, error: studyPackError } = await supabase
    .from("study_packs")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (studyPackError) {
    throw new Error(
      studyPackError.message || "Could not load this document workspace.",
    );
  }

  const document = mapSourceDocument(documentRow as Record<string, unknown>);
  const studyPack = studyPackRow
    ? mapStudyPack(studyPackRow as Record<string, unknown>)
    : null;
  const flashcardsCount = await getFlashcardsCount(documentId, studyPack?.id);

  return {
    document,
    studyPack,
    flashcardsCount,
  };
}
