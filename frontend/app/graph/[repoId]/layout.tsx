import { EditorProvider } from "@/context/EditorContext";

export default function GraphLayout({ children }: { children: React.ReactNode }) {
  return <EditorProvider>{children}</EditorProvider>;
}
