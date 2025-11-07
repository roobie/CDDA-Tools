export type TreeNode = {
  name: string;
  relativePath: string;
  type: "file" | "directory";
  children?: TreeNode[];
};
