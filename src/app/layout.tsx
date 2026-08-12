import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import NavbarWrapper from "@/components/navbar-wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Desarrollo de Líderes y Equipo",
  description: "Evaluación de Desarrollo de Líderes y Equipo",
  icons: {
    icon: "/logo-rizoma.svg",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let nombre: string | null = null
  if (user) {
    const { data: perfilData } = await supabase
      .from('perfiles')
      .select('nombre')
      .eq('id', user.id)
      .maybeSingle()
    nombre = perfilData?.nombre ?? null
  }

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var dirty = typeof document !== 'undefined' ? document.querySelectorAll('[bis_skin_checked]') : [];
                for (var i = 0; i < dirty.length; i++) { dirty[i].removeAttribute('bis_skin_checked'); }
                if (typeof Element !== 'undefined' && Element.prototype) {
                  var orig = Element.prototype.setAttribute;
                  Element.prototype.setAttribute = function(name, value) {
                    if (name && name.toLowerCase() === 'bis_skin_checked') return this;
                    return orig.call(this, name, value);
                  };
                  var origNS = Element.prototype.setAttributeNS;
                  if (typeof origNS === 'function') {
                    Element.prototype.setAttributeNS = function(ns, name, value) {
                      if (name && name.toLowerCase() === 'bis_skin_checked') return;
                      return origNS.call(this, ns, name, value);
                    };
                  }
                }
                var observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(m) {
                    if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked') {
                      m.target.removeAttribute('bis_skin_checked');
                    }
                    m.addedNodes.forEach(function(node) {
                      if (node.nodeType !== 1) return;
                      if (node.getAttribute && node.getAttribute('bis_skin_checked') !== null) {
                        node.removeAttribute('bis_skin_checked');
                      }
                      var d = node.querySelectorAll ? node.querySelectorAll('[bis_skin_checked]') : [];
                      for (var j = 0; j < d.length; j++) { d[j].removeAttribute('bis_skin_checked'); }
                    });
                  });
                });
                observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['bis_skin_checked'] });
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <div suppressHydrationWarning>
          {user && <NavbarWrapper user={user} nombre={nombre} />}
          {children}
        </div>
      </body>
    </html>
  )
}
