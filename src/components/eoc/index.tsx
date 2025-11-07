import { createResource, createSignal, For, Match, Show, Switch } from "solid-js";
import type { TreeNode } from "@/types/tree";
import {
  EocConditionValidator,
  EocEffectValidator,
  EocItemValidator,
  isArrayOfEocEffect,
  isCompundEocCondition,
  isEocCondition,
  isEocEffect,
  isEocItem,
  isLeafEocCondition,
  LeafEocConditionValidator,
  type EocItem,
  type LeafEocCondition,
} from "@/types/cdda";
import { InteractiveTree, type UiTreeNode } from "@/components/InteractiveTree";

export const prerender = false;

const uiState = {
  expandedNodes: new Set<string>(),

  // loadedNode: "effects_on_condition\\addictions_eocs.json",
  // initialIndex: 2,
  // initialIndex: 6,

  loadedNode: "item_eocs.json",
  initialIndex: 11,

  // loadedNode: "effects_on_condition\\general_conditions.json",
  // initialIndex: 0,
};
uiState.expandedNodes.add("json");
uiState.expandedNodes.add("effects_on_condition");

// this is a solidjs component
export function EocView() {
  const endpointTree = "/api/fs/v1/tree";
  const [selectedIndex, setSelectedIndex] = createSignal<number>(uiState.initialIndex ?? 0);
  const [selectedNode, setSelectedNode] = createSignal<UiTreeNode | null>(null);
  const [tree] = createResource(async () => {
    const res = await fetch(endpointTree);
    const data: UiTreeNode[] = await res.json();
    data.sort((a, b) => {
      // asc by type (directory first), then asc by name
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === "directory" ? -1 : 1;
    });

    updateFromState(data, setSelectedNode);

    return data;
  });

  // load selected node via /api/fs/v1/[name].tsx when selectedNode changes
  const [selectedNodeContent] = createResource(selectedNode, async (node) => {
    if (!node) return null;
    if (node.type === "directory") return null;
    const res = await fetch(`/api/fs/v1/${encodeURIComponent(node.relativePath)}`);
    const data = await res.text();
    return data;
  });
  function editor() {
    const parsed = JSON.parse(selectedNodeContent() || "[]") ?? [];
    const toReturn = [<DataList entries={parsed} selectIndex={setSelectedIndex} />];
    const item = parsed[selectedIndex()];
    if (!item) {
      return <div>-</div>;
    } else if (isEocItem(item)) {
      toReturn.push(
        <div class="flex-1">
          <EocItemView instance={item} />
        </div>,
      );
    } else {
      const validationErrors = EocItemValidator.Errors(item);
      console.log("EocItem validation errors:", item, [...validationErrors]);
    }
    return <div class="flex flex-row gap-4 relative">{toReturn}</div>;
  }

  return (
    <div class="flex flex-col gap-4 flex-1">
      <div>EocView component</div>
      <div class="flex flex-row gap-4 flex-1">
        <div>
          <Show when={tree.loading}>Loading tree...</Show>
          <Show when={tree()}>
            {(data) => (
              <InteractiveTree
                treeData={data()}
                onNodeSelect={(node) => {
                  setSelectedIndex(0);
                  setSelectedNode(node);
                }}
              />
            )}
          </Show>
        </div>
        <div class="flex flex-col gap-2 flex-1">
          <div>{editor()}</div>
          <div>
            <pre>{selectedNodeContent()}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DataList({ entries, selectIndex }: { entries: unknown[]; selectIndex: (i: number) => void }) {
  function getTypeTag(typeName: string): string {
    if (typeName === "effect_on_condition") {
      return "EOC";
    } else if (typeName === "jmath_function") {
      return "JMF";
    }
    return typeName;
  }

  return (
    <div class="max-h-[calc(100dvh-5rem)] overflow-y-scroll flex-1 max-w-1/3">
      <Show when={entries && entries.length > 0}>
        <table class="border-collapse border border-gray-400 min-w-0">
          <colgroup>
            <col class="border-r" />
            <col />
            <col class="w-full" />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th>#</th>
              <th>T</th>
              <th>Id</th>
              <th>_</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry: any, index) => (
              <tr class="border border-gray-300">
                <td class="font-mono">{index}</td>
                <td>{getTypeTag(String(entry["type"]))}</td>
                <td class="pl-4">{String(entry["id"])}</td>
                <td>
                  <button
                    type="button"
                    class="cursor-pointer"
                    on:click={(e) => {
                      selectIndex(index);
                    }}
                  >
                    &raquo;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Show>
      <Show when={!entries || entries.length === 0}>
        <div>No entries to display.</div>
      </Show>
    </div>
  );
}

export function EocItemView({ instance }: { instance: EocItem }) {
  return (
    <div>
      <Show when={instance}>
        <div>EOC:</div>
        <table class="w-full">
          <colgroup></colgroup>
          <tbody>
            <tr>
              <td class="text-gray-500 text-right">Type</td>
              <td>{instance.type}</td>
            </tr>
            <tr>
              <td class="text-gray-500 text-right">ID</td>
              <td>{instance.id}</td>
            </tr>
            <tr>
              <td class="text-gray-500 text-right">Condition</td>
              <td class="font-mono">{renderCondition(instance.condition)}</td>
            </tr>
            <tr>
              <td class="text-gray-500 text-right">Effect</td>
              <td class="font-mono">{renderEffect(instance.effect)}</td>
            </tr>
          </tbody>
        </table>
      </Show>
      <Show when={!instance}>
        <div>No item selected.</div>
      </Show>
    </div>
  );
}

function renderEffect(effect: unknown) {
  if (isArrayOfEocEffect(effect)) {
    return <For each={effect}>{(eff) => <div>{renderEffect(eff)}</div>}</For>;
  }
  if (isEocEffect(effect)) {
    if (typeof effect === "string") {
      return <span>{effect}</span>;
    } else if ("u_message" in effect) {
      return (
        <div>
          <div>
            message: '{effect.u_message}', {effect.type}
          </div>
        </div>
      );
    } else if ("if" in effect) {
      return (
        <div class="bg-[rgba(212,212,212,0.1)] mb-4 pb-2 pr-2">
          <div>
            <span class="border-gray-300 p-1">IF</span>
          </div>
          <div class="ml-8 border border-gray-300 p-1">{renderCondition(effect.if)}</div>
          <div>
            <span class="border-gray-300 p-1">THEN</span>
          </div>
          <div class="ml-8 border border-gray-300 p-1">{renderEffect(effect.then)}</div>
          <Show when={effect.else}>
            <div>
              <span class="border-gray-300 p-1">ELSE</span>
            </div>
            <div class="ml-8 border border-gray-300 p-1">{renderEffect(effect.else)}</div>
          </Show>
        </div>
      );
    } else if ("math" in effect) {
      // TODO: use LeafEocConditionSchema
      return (
        <div>
          <div>math: {Array.isArray(effect.math) ? effect.math.join("") : effect.math}</div>
        </div>
      );
    } else if ("u_add_morale" in effect) {
      return (
        <div>
          <div>
            u_add_morale: {effect.u_add_morale}, {effect.bonus}, {effect.max_bonus}
          </div>
        </div>
      );
    }
    return <span>_</span>;
  } else {
    const validationErrors = EocEffectValidator.Errors(effect);
    console.log("EocEffect validation errors:", effect, [...validationErrors]);
    return (
      <div>
        <span>Invalid EocEffect</span>
        <ul>
          {[...validationErrors].map((err) => (
            <li>{JSON.stringify(err)}</li>
          ))}
        </ul>
      </div>
    );
  }
}
function renderCondition(condition: unknown) {
  const validationErrors = EocConditionValidator.Errors(condition);
  if ([...validationErrors].length > 0) {
    console.log("Condition validation errors:", condition, [...validationErrors]);
  }

  if (!condition) {
    return <span>-</span>;
  }

  if (Array.isArray(condition)) {
    return <span>Array?!</span>;
  }

  if (isCompundEocCondition(condition)) {
    const classes = "flex flex-row items-center gap-2 border-gray-300 border p-1";
    const classes2 = "ml-4 border border-gray-300 p-1";
    if ("and" in condition) {
      return (
        <div class={classes}>
          <div>AND</div>
          <div>
            <For each={condition.and}>{(cond) => <div class={classes2}>{renderCondition(cond)}</div>}</For>
          </div>
        </div>
      );
    } else if ("or" in condition) {
      return (
        <div class={classes}>
          <div>OR</div>
          <div>
            <For each={condition.or}>{(cond) => <div class={classes2}>{renderCondition(cond)}</div>}</For>
          </div>
        </div>
      );
    } else if ("not" in condition) {
      return (
        <div class={classes}>
          <div>NOT</div>
          <div class={classes2}>{renderCondition(condition.not)}</div>
        </div>
      );
    }
  }
  if (isLeafEocCondition(condition)) {
    console.log(condition);
    const renderItem = (c: LeafEocCondition) => {
      if (typeof c === "string") {
        return <span>{c}</span>;
      }
      if ("math" in c) {
        return (
          <tr>
            <td>math: {Array.isArray(condition.math) ? condition.math.join("") : condition.math}</td>
          </tr>
        );
      }

      const k = Object.keys(c)[0];
      return (
        <tr>
          <td>
            {k}: {k in c && String(c[k])}
          </td>
        </tr>
      );
    };
    return (
      <table>
        <tbody>{renderItem(condition)}</tbody>
      </table>
    );
  }
  return <span>Unknown Condition</span>;
}

function updateFromState(data: UiTreeNode[], setSelectedNode: (s: TreeNode) => void) {
  // recursively expand nodes based on uiState
  function traverse(nodes: UiTreeNode[]) {
    for (const node of nodes) {
      if (uiState.expandedNodes.has(node.name)) {
        node.isExpanded = true;
      }
      if (node.type === "directory" && node.children) {
        traverse(node.children);
      } else if (node.type === "file") {
        // console.log(node.relativePath === uiState.loadedNode, node, uiState.loadedNode);
        if (uiState.loadedNode === node.relativePath) {
          setSelectedNode(node);
        }
      }
    }
  }

  traverse(data);
}
