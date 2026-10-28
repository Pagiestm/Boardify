// Assemble le latest.json lu par l'updater de l'application desktop à partir des
// fichiers déjà publiés dans la release GitHub (bundles + signatures .sig).
// Usage : TAG=v1.10.0 GH_TOKEN=… node scripts/updater-manifest.mjs > latest.json

const REPOSITORY = process.env.GITHUB_REPOSITORY ?? "Pagiestm/Boardify";
const { TAG, GH_TOKEN } = process.env;

const PLATFORMS = {
  "darwin-aarch64": /_aarch64\.app\.tar\.gz$/,
  "darwin-x86_64": /_x64\.app\.tar\.gz$/,
  "windows-x86_64": /_x64-setup\.exe$/,
  "linux-x86_64": /_amd64\.AppImage$/,
};

if (!TAG) throw new Error("Variable TAG manquante");

const github = async (url, accept = "application/vnd.github+json") => {
  const response = await fetch(url, {
    headers: {
      Accept: accept,
      ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`${url} : ${response.status} ${response.statusText}`);
  return response;
};

const release = await (
  await github(`https://api.github.com/repos/${REPOSITORY}/releases/tags/${TAG}`)
).json();

const platforms = {};
for (const [platform, pattern] of Object.entries(PLATFORMS)) {
  const bundle = release.assets.find((asset) => pattern.test(asset.name));
  const signature = bundle && release.assets.find((asset) => asset.name === `${bundle.name}.sig`);
  if (!bundle || !signature) {
    throw new Error(`Bundle ou signature introuvable pour ${platform}`);
  }

  platforms[platform] = {
    signature: (await (await github(signature.url, "application/octet-stream")).text()).trim(),
    url: bundle.browser_download_url,
  };
}

const manifest = {
  version: TAG.replace(/^v/, ""),
  notes: `Voir les nouveautés : ${release.html_url}`,
  pub_date: release.published_at ?? new Date().toISOString(),
  platforms,
};

process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
