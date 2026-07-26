"use client";

import Image from "next/image";
import {
  ChartNoAxesCombined,
  Compass,
  FilePenLine,
  Filter,
  MessagesSquare,
  PenTool,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties, PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

type Service = {
  title: string;
  description: string;
};

type WorkItem = {
  name: string;
  image: string;
  alt: string;
  href: string;
  services: string;
};

type InstagramPost = {
  id: string;
  caption: string;
  mediaType: string;
  imageUrl: string;
  permalink: string;
  timestamp: string;
  handle: string;
};

type InstagramAccount = {
  handle: string;
  label: string;
  profileUrl: string;
  available: boolean;
  posts: InstagramPost[];
};

type InstagramFeedResponse = {
  accounts?: InstagramAccount[];
  available?: boolean;
};

const serviceIcons: LucideIcon[] = [
  PenTool,
  Compass,
  Filter,
  MessagesSquare,
  FilePenLine,
  ChartNoAxesCombined,
];

export function MotionController() {
  useEffect(() => {
    const root = document.documentElement;
    const header = document.querySelector(".site-header");
    const hero = document.querySelector<HTMLElement>(".hero");
    const scrollScenes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-scroll-scene]"),
    );
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let animationFrame = 0;

    const updateScrollState = () => {
      animationFrame = 0;
      const scrollY = window.scrollY;
      header?.classList.toggle("is-scrolled", scrollY > 24);

      if (!reducedMotion.matches && hero && scrollY < window.innerHeight * 1.2) {
        hero.style.setProperty(
          "--hero-shift",
          `${Math.min(scrollY * 0.075, 60)}px`,
        );
      }

      if (reducedMotion.matches) return;

      const viewportHeight = window.innerHeight;

      scrollScenes.forEach((scene) => {
        const bounds = scene.getBoundingClientRect();
        const travel = viewportHeight + bounds.height;
        const progress = Math.min(
          1,
          Math.max(0, (viewportHeight - bounds.top) / travel),
        );
        const centerDistance =
          bounds.top + bounds.height / 2 - viewportHeight / 2;
        const shift = Math.min(
          1,
          Math.max(
            -1,
            centerDistance / ((viewportHeight + bounds.height) / 2),
          ),
        );

        scene.style.setProperty("--scene-progress", progress.toFixed(4));
        scene.style.setProperty("--scene-y", `${(shift * 30).toFixed(2)}px`);
        scene.style.setProperty(
          "--scene-y-slow",
          `${(shift * 13).toFixed(2)}px`,
        );
        scene.style.setProperty("--scene-x", `${(shift * 20).toFixed(2)}px`);
        scene.style.setProperty(
          "--scene-x-reverse",
          `${(shift * -20).toFixed(2)}px`,
        );
      });
    };

    const requestScrollUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateScrollState);
    };

    const closeNavigationAfterSelection = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest(
        ".mobile-nav a, .client-menu-panel a, .field-notes-mobile-menu a",
      );
      link?.closest("details")?.removeAttribute("open");
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );

    const observeRevealItems = (scope: ParentNode) => {
      if (scope instanceof HTMLElement && scope.matches("[data-reveal]")) {
        observer.observe(scope);
      }
      scope
        .querySelectorAll<HTMLElement>("[data-reveal]")
        .forEach((item) => observer.observe(item));
    };

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) observeRevealItems(node);
        });
      });
    });

    observeRevealItems(document);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    root.classList.add("motion-ready");
    updateScrollState();
    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate);
    document.addEventListener("click", closeNavigationAfterSelection);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", requestScrollUpdate);
      window.removeEventListener("resize", requestScrollUpdate);
      document.removeEventListener("click", closeNavigationAfterSelection);
      root.classList.remove("motion-ready");
    };
  }, []);

  return null;
}

export function ServiceAccordion({ services }: { services: Service[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="service-list">
      {services.map((service, index) => {
        const isActive = activeIndex === index;

        const ServiceIcon = serviceIcons[index];

        return (
          <article
            className={`service-row${isActive ? " is-active" : ""}`}
            key={service.title}
            onMouseEnter={() => setActiveIndex(index)}
          >
            <button
              className="service-trigger"
              type="button"
              aria-expanded={isActive}
              aria-controls={`service-panel-${index}`}
              onClick={() => setActiveIndex(index)}
            >
              <span className="service-icon" aria-hidden="true">
                <ServiceIcon strokeWidth={1.25} />
              </span>
              <span className="service-title">{service.title}</span>
              <span className="service-mark" aria-hidden="true">
                {isActive ? "—" : "+"}
              </span>
            </button>
            <div
              className="service-panel"
              id={`service-panel-${index}`}
              aria-hidden={!isActive}
            >
              <p>{service.description}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function InstagramFeed() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [activeHandle, setActiveHandle] = useState("all");
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );

  useEffect(() => {
    const controller = new AbortController();

    const loadFeed = async () => {
      try {
        const response = await fetch("/api/instagram", {
          headers: { accept: "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Instagram feed unavailable");

        const payload = (await response.json()) as InstagramFeedResponse;
        const nextAccounts = payload.accounts ?? [];

        setAccounts(nextAccounts);

        if (!payload.available) {
          setStatus("unavailable");
          return;
        }

        setStatus("ready");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setStatus("unavailable");
        }
      }
    };

    void loadFeed();
    return () => controller.abort();
  }, []);

  if (status === "loading") {
    return (
      <>
        <div className="instagram-account-loading" aria-hidden="true" />
        <div className="instagram-grid instagram-loading" aria-label="Loading Instagram posts">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="instagram-skeleton" aria-hidden="true" key={index} />
          ))}
        </div>
      </>
    );
  }

  const allPosts = accounts
    .flatMap((account) => account.posts)
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() -
        new Date(left.timestamp).getTime(),
    )
    .slice(0, 9);
  const activeAccount = accounts.find(
    (account) => account.handle === activeHandle,
  );
  const visiblePosts =
    activeHandle === "all" ? allPosts : activeAccount?.posts ?? [];

  if (status === "unavailable") {
    return (
      <>
        <InstagramAccountNav
          accounts={accounts}
          activeHandle={activeHandle}
          onSelect={setActiveHandle}
          showAll={false}
        />
        <div className="instagram-fallback">
          <div>
            <span>Instagram network</span>
            <p>Follow the work happening across the brands we support.</p>
          </div>
          <div className="instagram-profile-links">
            {accounts.map((account) => (
              <a
                href={account.profileUrl}
                target="_blank"
                rel="noreferrer"
                key={account.handle}
              >
                <span>{account.label}</span>
                <strong>@{account.handle}</strong>
                <i aria-hidden="true">↗</i>
              </a>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <InstagramAccountNav
        accounts={accounts}
        activeHandle={activeHandle}
        onSelect={setActiveHandle}
        showAll
      />
      {visiblePosts.length ? (
        <div className="instagram-grid">
          {visiblePosts.map((post) => {
            const postDate = post.timestamp
              ? new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date(post.timestamp))
              : "";
            const accessibleCaption =
              post.caption ||
              `@${post.handle} Instagram post${postDate ? ` from ${postDate}` : ""}`;

            return (
              <a
                className="instagram-card"
                href={post.permalink}
                target="_blank"
                rel="noreferrer"
                aria-label={`View on Instagram: ${accessibleCaption.slice(0, 120)}`}
                key={`${post.handle}-${post.id}`}
              >
                <span className="instagram-image">
                  <Image
                    src={post.imageUrl}
                    alt={accessibleCaption}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized
                  />
                  {post.mediaType === "VIDEO" ? (
                    <span className="instagram-media-label">Reel</span>
                  ) : null}
                  <span className="instagram-account-label">
                    @{post.handle}
                  </span>
                  <span className="instagram-open" aria-hidden="true">
                    ↗
                  </span>
                </span>
                <span className="instagram-meta">
                  <span>{post.caption || `From @${post.handle}`}</span>
                  {postDate ? (
                    <time dateTime={post.timestamp}>{postDate}</time>
                  ) : null}
                </span>
              </a>
            );
          })}
        </div>
      ) : (
        <div className="instagram-feed-message">
          <p>Posts for @{activeAccount?.handle} are not available yet.</p>
          {activeAccount ? (
            <a href={activeAccount.profileUrl} target="_blank" rel="noreferrer">
              Open Instagram <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
      )}
    </>
  );
}

function InstagramAccountNav({
  accounts,
  activeHandle,
  onSelect,
  showAll,
}: {
  accounts: InstagramAccount[];
  activeHandle: string;
  onSelect: (handle: string) => void;
  showAll: boolean;
}) {
  return (
    <div className="instagram-account-nav" aria-label="Instagram accounts">
      {showAll ? (
        <button
          className={activeHandle === "all" ? "is-active" : undefined}
          onClick={() => onSelect("all")}
          type="button"
        >
          All brands
        </button>
      ) : null}
      {accounts.map((account) => (
        <button
          className={activeHandle === account.handle ? "is-active" : undefined}
          onClick={() => onSelect(account.handle)}
          type="button"
          key={account.handle}
        >
          @{account.handle}
          <span
            className={account.posts.length ? "is-live" : undefined}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}

export function WorkGallery({ work }: { work: WorkItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const activeItem = activeIndex === null ? null : work[activeIndex];

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (activeItem && !dialog.open) {
      dialog.showModal();
    } else if (!activeItem && dialog.open) {
      dialog.close();
    }
  }, [activeItem]);

  const closePreview = () => setActiveIndex(null);

  const handlePointerMove = (
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--pointer-x",
      `${event.clientX - bounds.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--pointer-y",
      `${event.clientY - bounds.top}px`,
    );
  };

  return (
    <>
      <div className="work-grid">
        {work.map((item, index) => (
          <button
            className="work-card"
            type="button"
            key={item.name}
            onClick={() => setActiveIndex(index)}
            onPointerMove={handlePointerMove}
            data-reveal
            style={{ "--reveal-delay": `${index * 90}ms` } as CSSProperties}
          >
            <div className="work-image">
              <Image
                src={item.image}
                alt={item.alt}
                fill
                sizes="(max-width: 800px) 100vw, 33vw"
                unoptimized
              />
              <span className="work-cursor" aria-hidden="true">
                ↗
              </span>
            </div>
            <div className="work-meta">
              <div>
                <h3>{item.name}</h3>
                <p>{item.services}</p>
              </div>
              <span aria-hidden="true">↗</span>
            </div>
          </button>
        ))}
      </div>

      <dialog
        className="work-dialog"
        ref={dialogRef}
        onClose={closePreview}
        onCancel={closePreview}
        onClick={(event) => {
          if (event.target === event.currentTarget) closePreview();
        }}
      >
        {activeItem ? (
          <div className="work-dialog-inner">
            <button
              className="dialog-close"
              type="button"
              onClick={closePreview}
              aria-label="Close project preview"
            >
              <span aria-hidden="true">×</span>
            </button>
            <div className="dialog-visual">
              <Image
                src={activeItem.image}
                alt={activeItem.alt}
                fill
                sizes="(max-width: 800px) 100vw, 70vw"
                unoptimized
              />
              <iframe
                src={activeItem.href}
                title={`${activeItem.name} website preview`}
                loading="eager"
              />
            </div>
            <div className="dialog-meta">
              <div>
                <h3>{activeItem.name}</h3>
                <p>{activeItem.services}</p>
              </div>
              <a
                href={activeItem.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Visit ${activeItem.name}`}
              >
                ↗
              </a>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
