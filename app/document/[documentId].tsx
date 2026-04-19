import { useLocalSearchParams } from "expo-router";

import DocumentWorkspaceScreen from "@/src/screens/DocumentWorkspaceScreen";

export default function DocumentWorkspaceRoute() {
  const { documentId } = useLocalSearchParams<{ documentId: string }>();

  return <DocumentWorkspaceScreen documentId={documentId} />;
}
