import { defineRule } from "@oxlint/plugins";

import type { ESTree, SourceCode } from "@oxlint/plugins";

type TypeAssertion = ESTree.TSAsExpression | ESTree.TSTypeAssertion;

const commentOwnerKinds = new Set([
  "ExpressionStatement",
  "PropertyDefinition",
  "ReturnStatement",
  "ThrowStatement",
  "VariableDeclaration",
]);

const exportWrapperKinds = new Set(["ExportNamedDeclaration", "ExportDefaultDeclaration"]);

function isConstAssertion(node: TypeAssertion): boolean {
  return (
    node.typeAnnotation.type === "TSTypeReference" &&
    node.typeAnnotation.typeName.type === "Identifier" &&
    node.typeAnnotation.typeName.name === "const"
  );
}

function hasSafetyCommentBefore(
  sourceCode: SourceCode,
  anchor: ESTree.Node,
  assertion: TypeAssertion,
): boolean {
  return sourceCode
    .getCommentsBefore(anchor)
    .some((comment) => comment.end <= assertion.start && /\bSAFETY\s*:/u.test(comment.value));
}

function hasSafetyComment(sourceCode: SourceCode, node: TypeAssertion): boolean {
  let current: ESTree.Node = node;
  while (true) {
    if (hasSafetyCommentBefore(sourceCode, current, node)) return true;
    if (commentOwnerKinds.has(current.type)) {
      // A `// SAFETY: ...` comment immediately before `export const x = ... as T` attaches to
      // the export wrapper, not to the inner declaration, so check it once before giving up.
      const { parent } = current;
      return (
        exportWrapperKinds.has(parent.type) && hasSafetyCommentBefore(sourceCode, parent, node)
      );
    }
    if (current.parent.type === "Program") return false;
    current = current.parent;
  }
}

/** Require every non-const type assertion to state the invariant TypeScript cannot express. */
export const requireSafetyCommentForTypeAssertionRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a nearby SAFETY comment for every TypeScript type assertion except const assertions.",
    },
    messages: {
      missingSafetyComment:
        "This type assertion has no `SAFETY:` justification. Remove it when possible; otherwise state the checked invariant immediately before it. See: docs/rules/require-safety-comment-for-type-assertion.md",
    },
  },
  create(context) {
    const checkAssertion = (node: TypeAssertion) => {
      if (isConstAssertion(node) || hasSafetyComment(context.sourceCode, node)) return;
      context.report({ node, messageId: "missingSafetyComment" });
    };

    return {
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion,
    };
  },
});
