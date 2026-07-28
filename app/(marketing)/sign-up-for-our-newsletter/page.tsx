import { ContactForm } from "@/components/contact-form";
import { PageIntro } from "@/components/page-intro";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Newsletter",
  description:
    "Request practical marketing, brand, and business-growth updates from D2D Marketing.",
  path: "/sign-up-for-our-newsletter",
});

export default function NewsletterPage() {
  return (
    <>
      <PageIntro
        eyebrow="Newsletter"
        title="Stay connected to practical marketing ideas."
        description="Share your details to request DAY2DAY Marketing updates. Our team will confirm your request and the type of information you want to receive."
      />
      <section className="mx-auto max-w-3xl px-6 py-18 lg:px-8">
        <ContactForm
          initialMessage="Please add me to the DAY2DAY Marketing newsletter updates."
          messageLabel="What updates would be most useful?"
          messagePlaceholder="Tell us which marketing, brand, leadership, or growth topics you want to receive."
          submitLabel="Request Updates"
        />
      </section>
    </>
  );
}
