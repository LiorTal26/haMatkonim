import ts from 'typescript';
import { createHash } from 'node:crypto';

const printer = ts.createPrinter({ removeComments: true });

export function textHash(text: string) {
  return createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex');
}

// Ignore render markup and imports, but separately retain every existing event
// handler. A visual reskin must not rewrite CRUD, scaling, state, or egg triggers.
export function presentationIntegrity(source: string, path: string) {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const events: string[] = [];
  function collect(node: ts.Node) {
    if (ts.isJsxAttribute(node) && /^on[A-Z]/.test(node.name.getText(file)) && node.initializer) {
      events.push(printer.printNode(ts.EmitHint.Unspecified, node.initializer, file));
    }
    ts.forEachChild(node, collect);
  }
  collect(file);
  const result = ts.transform(file, [context => root => {
    const visit: ts.Visitor = node => {
      if (ts.isImportDeclaration(node)) return undefined;
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) return ts.factory.createIdentifier('__VIEW__');
      return ts.visitEachChild(node, visit, context);
    };
    return ts.visitNode(root, visit) as ts.SourceFile;
  }]);
  try {
    return { logic: textHash(printer.printFile(result.transformed[0])), events: textHash(events.join('\n')) };
  } finally { result.dispose(); }
}
