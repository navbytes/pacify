// src/editor/templates.ts
export const scriptTemplates: Record<
  'empty' | 'basic' | 'advanced' | 'pro',
  string
> = {
  empty: `function FindProxyForURL(url, host) {
  // add your custom logic here
  
  // Skip proxy for all traffic
  return "PROXY proxy.company.com:8080";
}`,
  basic: `function FindProxyForURL(url, host) {
  // Direct access for internal hosts
  if (shExpMatch(host, "*.internal.company.com")) {
    return "DIRECT";
  }

  // Use proxy for all other traffic
  return "PROXY proxy.company.com:8080";
}`,

  advanced: `function FindProxyForURL(url, host) {
  // Convert host to lowercase
  host = host.toLowerCase();
  
  // Helper function to check if IP is in subnet
  function isInNet(ip, subnet, mask) {
    var ip_a = ip.split('.');
    var subnet_a = subnet.split('.');
    var mask_a = mask.split('.');
    for (var i = 0; i < 4; i++) {
      if ((ip_a[i] & mask_a[i]) != (subnet_a[i] & mask_a[i])) return false;
    }
    return true;
  }

  // Direct access for internal hosts
  if (shExpMatch(host, "*.internal.company.com") ||
      shExpMatch(host, "*.local") ||
      isInNet(dnsResolve(host), "10.0.0.0", "255.0.0.0") ||
      isInNet(dnsResolve(host), "172.16.0.0", "255.240.0.0") ||
      isInNet(dnsResolve(host), "192.168.0.0", "255.255.0.0")) {
    return "DIRECT";
  }

  // Use different proxies based on URL pattern
  if (shExpMatch(url, "http://special.company.com/*")) {
    return "PROXY special-proxy.company.com:8080";
  }

  if (shExpMatch(url, "*.streaming.*")) {
    return "PROXY streaming-proxy.company.com:8080";
  }

  // Default proxy for all other traffic
  return "PROXY proxy.company.com:8080; DIRECT";
}`,

  pro: `function FindProxyForURL(url, host) {
  // Constants for proxy configurations
  const DIRECT_CONNECTION = "DIRECT";
  const PRIMARY_PROXY = "PROXY primary-proxy.company.com:8080";
  const BACKUP_PROXY = "PROXY backup-proxy.company.com:8080";
  const SECURE_PROXY = "HTTPS secure-proxy.company.com:443";
  const SOCKS_PROXY = "SOCKS5 socks-proxy.company.com:1080";

  // Failover chain for high availability
  const FAILOVER_CHAIN = \`\${PRIMARY_PROXY}; \${BACKUP_PROXY}; \${DIRECT_CONNECTION}\`;

  // Convert hostname to lowercase for consistent matching
  const lowerHost = host.toLowerCase();
  const ipAddress = dnsResolve(host);

  // Helper functions
  function isInternalIP(ip) {
    if (!ip) return false;
    
    // Check private IP ranges
    const privateRanges = [
      /^10\\./,                    // 10.0.0.0 - 10.255.255.255
      /^172\\.(1[6-9]|2[0-9]|3[0-1])\\./,  // 172.16.0.0 - 172.31.255.255
      /^192\\.168\\./,             // 192.168.0.0 - 192.168.255.255
      /^127\\./,                  // Localhost
      /^169\\.254\\./,             // Link-local
      /^fc00:/,                  // Unique local IPv6
      /^fe80:/                   // Link-local IPv6
    ];

    return privateRanges.some(range => range.test(ip));
  }

  function isWorkingHours() {
    const date = new Date();
    const hours = date.getUTCHours();
    const day = date.getUTCDay();

    // Define working hours (9 AM - 6 PM UTC, Monday to Friday)
    return day >= 1 && day <= 5 && hours >= 9 && hours < 18;
  }

  function matchDomain(pattern, domain) {
    const regexPattern = pattern
      .replace(/\\./g, '\\\\.')
      .replace(/\\*/g, '.*');
    return new RegExp(\`^\${regexPattern}$\`).test(domain);
  }

  // Always use direct connection for internal resources
  if (isInternalIP(ipAddress)) {
    return DIRECT_CONNECTION;
  }

  // Blocked domains (example: social media during work hours)
  const blockedDomains = [
    "*.facebook.com",
    "*.twitter.com",
    "*.instagram.com",
    "*.tiktok.com"
  ];

  if (isWorkingHours() && blockedDomains.some(pattern => matchDomain(pattern, lowerHost))) {
    return "PROXY 127.0.0.1:8080";
  }

  // Security-sensitive domains always use secure proxy
  const secureRoutes = [
    "*.banking.com",
    "*.payment-gateway.com",
    "*.internal-tools.company.com"
  ];

  if (secureRoutes.some(pattern => matchDomain(pattern, lowerHost))) {
    return SECURE_PROXY;
  }

  // Development environments
  if (matchDomain("*.dev.company.com", lowerHost)) {
    return isWorkingHours() ? PRIMARY_PROXY : DIRECT_CONNECTION;
  }

  // Special handling for specific countries
  try {
    if (isResolvable(host)) {
      const ip = dnsResolve(host);
      
      const asiaIP = /^(58\\.|59\\.|60\\.)/;
      const euIP = /^(81\\.|82\\.|83\\.)/;

      if (asiaIP.test(ip)) {
        return "PROXY asia-proxy.company.com:8080";
      }
      
      if (euIP.test(ip)) {
        return "PROXY eu-proxy.company.com:8080";
      }
    }
  } catch (e) {
    return FAILOVER_CHAIN;
  }

  // Protocol-specific routing
  if (url.substring(0, 6) === "https:") {
    return SECURE_PROXY;
  }

  if (url.substring(0, 4) === "ftp:" || url.substring(0, 5) === "sftp:") {
    return SOCKS_PROXY;
  }

  // Specific domain patterns
  const proxyPatterns = {
    "*.google.com": PRIMARY_PROXY,
    "*.github.com": PRIMARY_PROXY,
    "*.amazonaws.com": FAILOVER_CHAIN,
    "*.azure.com": FAILOVER_CHAIN
  };

  for (const [pattern, proxy] of Object.entries(proxyPatterns)) {
    if (matchDomain(pattern, lowerHost)) {
      return proxy;
    }
  }

  // Performance optimization for local domains
  if (dnsDomainIs(host, ".local") || dnsDomainIs(host, ".localhost")) {
    return DIRECT_CONNECTION;
  }

  // Default routing policy
  return isWorkingHours() ? FAILOVER_CHAIN : DIRECT_CONNECTION;
}`,
}
