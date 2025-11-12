import { createResource } from "solid-js";

type MaybeString = string | null | undefined;

const query = new URLSearchParams(window.location.search);
export function EocEditorPage() {
  return <EocEditor urn={query.get("urn")} />;
}

export function EocEditor(args: { urn: MaybeString }) {
  const [path, index] = parseUrn(args.urn);
  const [selectedNodeContent] = createResource(async () => {
    const res = await fetch(`/api/fs/v1/${encodeURIComponent(path)}`);
    const data = await res.text();
    return data;
  });

  function getItemForEdit() {
    const data = selectedNodeContent();
    if (!data) return null;
    const json = JSON.parse(data);
    return json[index];
  }
  return <div>EocEditor: {JSON.stringify(getItemForEdit())}</div>;
}
function parseUrn(urn: MaybeString): [string, number] {
  const parts = urn?.split("|");
  if (!parts || parts.length !== 2) {
    throw new Error("Invalid URN format");
  }
  const path = parts[0];
  const index = parseInt(parts[1], 10);
  if (isNaN(index)) {
    throw new Error("Index in URN is not a valid number");
  }
  return [path, index];
}
