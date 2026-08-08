module.exports = [
"[project]/src/components/graph-thumbnail.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GraphThumbnail",
    ()=>GraphThumbnail
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
"use client";
;
function GraphThumbnail({ definition, className }) {
    const { nodes, edges } = definition;
    if (nodes.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            viewBox: "0 0 200 80",
            className: className,
            "aria-hidden": "true",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "100",
                cy: "40",
                r: "3",
                fill: "var(--color-text-tertiary)",
                opacity: "0.5"
            }, void 0, false, {
                fileName: "[project]/src/components/graph-thumbnail.tsx",
                lineNumber: 23,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/graph-thumbnail.tsx",
            lineNumber: 22,
            columnNumber: 7
        }, this);
    }
    // Normalize node positions into the 0..200 x 0..80 viewBox regardless of
    // the real canvas coordinates, so every thumbnail fills its space
    // consistently no matter how the actual editor positions were laid out.
    const xs = nodes.map((n)=>n.position.x);
    const ys = nodes.map((n)=>n.position.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const pad = 16;
    const scaleX = (x)=>pad + (x - minX) / spanX * (200 - pad * 2);
    const scaleY = (y)=>pad + (y - minY) / spanY * (80 - pad * 2);
    const points = new Map(nodes.map((n)=>[
            n.id,
            {
                x: scaleX(n.position.x),
                y: scaleY(n.position.y)
            }
        ]));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        viewBox: "0 0 200 80",
        className: className,
        "aria-hidden": "true",
        children: [
            edges.map((e)=>{
                const from = points.get(e.source);
                const to = points.get(e.target);
                if (!from || !to) return null;
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                    x1: from.x,
                    y1: from.y,
                    x2: to.x,
                    y2: to.y,
                    stroke: "var(--color-border-strong)",
                    strokeWidth: "1.5"
                }, e.id, false, {
                    fileName: "[project]/src/components/graph-thumbnail.tsx",
                    lineNumber: 53,
                    columnNumber: 11
                }, this);
            }),
            nodes.map((n)=>{
                const p = points.get(n.id);
                const isTrigger = n.type === "trigger";
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: p.x,
                    cy: p.y,
                    r: isTrigger ? 4 : 3,
                    fill: isTrigger ? "var(--color-accent-amber)" : "var(--color-text-secondary)"
                }, n.id, false, {
                    fileName: "[project]/src/components/graph-thumbnail.tsx",
                    lineNumber: 68,
                    columnNumber: 11
                }, this);
            })
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/graph-thumbnail.tsx",
        lineNumber: 47,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=src_components_graph-thumbnail_tsx_18rwipy._.js.map