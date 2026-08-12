"use client";

import {
  useMemo,
  useSyncExternalStore,
} from "react";

type ForumRichContentProps = {
  html: string;
  className?: string;
};

const subscribeToHydration =
  () => () => {};
const getClientSnapshot =
  () => true;
const getServerSnapshot =
  () => false;

function sanitizeForumHtml(
  html: string,
) {
  const parser =
    new DOMParser();

  const documentValue =
    parser.parseFromString(
      html,
      "text/html",
    );

  const allowedTags =
    new Set([
      "A",
      "B",
      "BR",
      "DIV",
      "EM",
      "H1",
      "H2",
      "H3",
      "I",
      "IMG",
      "LI",
      "OL",
      "P",
      "SPAN",
      "STRONG",
      "U",
      "UL",
    ]);

  const allowedStyles =
    new Set([
      "font-size",
      "font-style",
      "font-weight",
      "text-align",
      "text-decoration",
    ]);

  const elements =
    Array.from(
      documentValue.body
        .querySelectorAll("*"),
    );

  for (
    const element
    of elements
  ) {
    if (
      !allowedTags.has(
        element.tagName,
      )
    ) {
      element.replaceWith(
        ...Array.from(
          element.childNodes,
        ),
      );
      continue;
    }

    for (
      const attribute
      of Array.from(
        element.attributes,
      )
    ) {
      const name =
        attribute.name
          .toLowerCase();

      if (
        name.startsWith("on")
      ) {
        element.removeAttribute(
          attribute.name,
        );
        continue;
      }

      if (
        name === "style"
      ) {
        const safeStyle =
          attribute.value
            .split(";")
            .map(
              (rule) =>
                rule.trim(),
            )
            .filter(Boolean)
            .filter((rule) => {
              const [
                property,
              ] =
                rule.split(":");

              return allowedStyles.has(
                property
                  ?.trim()
                  .toLowerCase(),
              );
            })
            .join("; ");

        if (safeStyle) {
          element.setAttribute(
            "style",
            safeStyle,
          );
        } else {
          element.removeAttribute(
            "style",
          );
        }

        continue;
      }

      if (
        element.tagName ===
        "A"
      ) {
        if (
          ![
            "href",
            "target",
            "rel",
          ].includes(name)
        ) {
          element.removeAttribute(
            attribute.name,
          );
        }
        continue;
      }

      if (
        element.tagName ===
        "IMG"
      ) {
        if (
          ![
            "src",
            "alt",
          ].includes(name)
        ) {
          element.removeAttribute(
            attribute.name,
          );
        }
        continue;
      }

      element.removeAttribute(
        attribute.name,
      );
    }

    if (
      element.tagName ===
      "A"
    ) {
      const href =
        element.getAttribute(
          "href",
        ) ?? "";

      if (
        href &&
        !/^(https?:|mailto:|tel:|\/|#)/i.test(
          href,
        )
      ) {
        element.removeAttribute(
          "href",
        );
      }

      element.setAttribute(
        "rel",
        "noopener noreferrer",
      );
    }

    if (
      element.tagName ===
      "IMG"
    ) {
      const src =
        element.getAttribute(
          "src",
        ) ?? "";

      if (
        src &&
        !/^(https?:|data:image\/)/i.test(
          src,
        )
      ) {
        element.remove();
      }
    }
  }

  return documentValue.body
    .innerHTML;
}

export function ForumRichContent({
  html,
  className = "",
}: ForumRichContentProps) {
  const hasMounted =
    useSyncExternalStore(
      subscribeToHydration,
      getClientSnapshot,
      getServerSnapshot,
    );

  const safeHtml = useMemo(
    () =>
      hasMounted
        ? sanitizeForumHtml(
            html,
          )
        : "",
    [
      hasMounted,
      html,
    ],
  );

  return (
    <div
      suppressHydrationWarning
      className={[
        "text-[15px] leading-7 text-slate-700",
        "[&_a]:text-blue-600 [&_a]:underline",
        "[&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:text-3xl [&_h1]:font-bold",
        "[&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-2xl [&_h2]:font-bold",
        "[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-xl [&_h3]:font-semibold",
        "[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl",
        "[&_li]:ml-6 [&_ol]:list-decimal [&_ul]:list-disc",
        "[&_p]:mb-3",
        className,
      ].join(" ")}
      dangerouslySetInnerHTML={{
        __html: safeHtml,
      }}
    />
  );
}