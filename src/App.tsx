import { PageHeader } from "@/components/page-header"
import { PageFooter } from "@/components/page-footer"
import { Callout } from "@/components/callout"
import { EditorPrototype } from "@/components/editor-prototype"

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-6xl px-4 md:px-6 py-10">
        <PageHeader
          type="Editor Experience"
          title={<>Verkada Maps 2.0<br /><span className="text-muted-foreground">Editor Prototype</span></>}
          subtitle="Interactive editor workspace — in-context edit mode, tool palette, device placement, and structural drawing. Built on the Navigation Audit IA with Maps v1 PRD editor MVP scope."
          createdDate="May 22, 2026"
          modifiedDate="May 22, 2026"
          stats={[
            { value: 14, label: "editor states" },
            { value: 3, label: "viewer states" },
            { value: 10, label: "editor tools" },
          ]}
          gradient="radial-gradient(ellipse 80% 60% at 15% 0%, oklch(0.55 0.18 230 / 0.7), transparent), radial-gradient(ellipse 60% 50% at 85% 0%, oklch(0.6 0.18 160 / 0.5), transparent)"
        />

        <Callout variant="info" title="Interactive prototype">
          Click preset states on the left to jump between editor scenarios. Tool selection, marker selection, panel navigation, and workspace focus persist in localStorage.
        </Callout>

        <EditorPrototype />

        <PageFooter author="Azalea Phangsoa" builtDate="2026-05-22" />
      </main>
    </div>
  )
}
