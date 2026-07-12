import { SITE_URL } from "@/lib/site";

const DEV_PARENT_HOSTS = ["localhost", "127.0.0.1"] as const;

function addHost(hosts: Set<string>, host: string | null | undefined) {
  const trimmed = host?.trim().toLowerCase();
  if (!trimmed) return;
  hosts.add(trimmed);
}

function addSiteUrlHosts(hosts: Set<string>) {
  try {
    const siteHost = new URL(SITE_URL).hostname.toLowerCase();
    addHost(hosts, siteHost);

    if (siteHost.startsWith("www.")) {
      addHost(hosts, siteHost.slice(4));
    } else {
      addHost(hosts, `www.${siteHost}`);
    }
  } catch {
    // Ignore invalid SITE_URL.
  }
}

/** Hostnames allowed in Twitch embed `parent` params for this deployment. */
export function getTwitchEmbedParentHosts(requestHost?: string | null): string[] {
  const hosts = new Set<string>(DEV_PARENT_HOSTS);
  addHost(hosts, requestHost?.split(":")[0]);
  addSiteUrlHosts(hosts);
  return Array.from(hosts);
}
