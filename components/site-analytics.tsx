import Script from "next/script";

const defaultGoogleTagManagerIds = ["GTM-TBJQ7ST", "GTM-PSG3J4T"];
const defaultMetaPixelIds = ["311694363580188", "565135724928570"];

function parseIds(value: string | undefined, defaults: string[]) {
  if (!value) {
    return defaults;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function SiteAnalytics() {
  const googleTagManagerIds = parseIds(
    process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_IDS,
    defaultGoogleTagManagerIds,
  );
  const metaPixelIds = parseIds(
    process.env.NEXT_PUBLIC_META_PIXEL_IDS,
    defaultMetaPixelIds,
  );

  return (
    <>
      {googleTagManagerIds.map((id) => (
        <Script id={`gtm-${id}`} key={id} strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${id}');
          `}
        </Script>
      ))}
      {metaPixelIds.length ? (
        <Script id="meta-pixels" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
            (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            ${metaPixelIds.map((id) => `fbq('init', '${id}');`).join("\n")}
            fbq('track', 'PageView');
          `}
        </Script>
      ) : null}
      {googleTagManagerIds.map((id) => (
        <noscript key={`gtm-noscript-${id}`}>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${id}`}
            height="0"
            width="0"
            className="hidden"
            title={`Google Tag Manager ${id}`}
          />
        </noscript>
      ))}
      {metaPixelIds.map((id) => (
        <noscript key={`meta-noscript-${id}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            height="1"
            width="1"
            className="hidden"
            src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
          />
        </noscript>
      ))}
    </>
  );
}
