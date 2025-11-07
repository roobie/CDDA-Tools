// this is a solidjs component that will render an interactive tree view
// e.g. similar to a file explorer overview pane.

import type { TreeNode } from "@/types/tree";
import clsx from "clsx";
import { For, Show } from "solid-js";

export type UiTreeNode = TreeNode & {
  // consumer may set this to true to highlight the node. This can be used as a metaphor for selection.
  isHighlighted?: boolean;
  isExpanded?: boolean;
  isDisabled?: boolean;
};
type OnNodeSelect = (node: TreeNode) => void;

export function InteractiveTree({ treeData, onNodeSelect }: { treeData: UiTreeNode[]; onNodeSelect?: OnNodeSelect }) {
  return (
    <div>
      <For each={treeData}>{(node) => <InteractiveTreeNode nodeData={node} onNodeSelect={onNodeSelect} />}</For>
    </div>
  );
}

export function InteractiveTreeNode({ nodeData, onNodeSelect }: { nodeData: UiTreeNode; onNodeSelect?: OnNodeSelect }) {
  return (
    <div>
      <Show when={nodeData.type === "directory"}>
        <details class={getClassNamesForNode(nodeData)} open={nodeData.isExpanded}>
          <summary on:click={(e) => onNodeSelect?.(nodeData)}>{nodeData.name}</summary>
          <div class="ml-4 border-l pl-2">
            <For each={nodeData.children}>
              {(child) => <InteractiveTreeNode nodeData={child} onNodeSelect={onNodeSelect} />}
            </For>
            <Show when={!nodeData.children || nodeData.children.length === 0}>
              <div class="italic">[empty]</div>
            </Show>
          </div>
        </details>
      </Show>
      <Show when={nodeData.type === "file"}>
        <div class={getClassNamesForNode(nodeData)} on:click={(e) => onNodeSelect?.(nodeData)}>
          {nodeData.name}
        </div>
      </Show>
    </div>
  );
}

function getClassNamesForNode(node: UiTreeNode) {
  return clsx(
    node.isHighlighted ? "bg-yellow-200" : "",
    node.isDisabled ? "opacity-50 pointer-events-none" : "cursor-pointer"
  );
}
