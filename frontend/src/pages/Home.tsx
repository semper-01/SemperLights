import { Section, Container } from "@/components/ui/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";

export default function Home() {
  return (
    <Section>
      <Container>
        <SectionTitle
          title="Welcome to Semper Lights"
          subtitle="Professional photography services capturing life's most precious moments."
        />
        <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-24">
          <p className="text-gray-400 text-lg">Home Page — Coming Soon</p>
        </div>
      </Container>
    </Section>
  );
}