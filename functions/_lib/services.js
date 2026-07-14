export async function loadServices(db, includeInactive = false) {
  const condition = includeInactive ? '1=1' : 's.is_active = 1 AND c.is_active = 1';
  const { results: services } = await db.prepare(`
    SELECT
      s.*, c.name AS category_name, c.slug AS category_slug
    FROM services s
    JOIN service_categories c ON c.id = s.category_id
    WHERE ${condition}
    ORDER BY s.sort_order, s.name
  `).all();

  if (!services.length) return [];
  const serviceIds = services.map((item) => item.id);
  const placeholders = serviceIds.map(() => '?').join(',');

  const packageCondition = includeInactive ? '1=1' : 'p.is_active = 1';
  const [{ results: packages }, { results: addons }] = await Promise.all([
    db.prepare(`
      SELECT * FROM service_packages p
      WHERE p.service_id IN (${placeholders}) AND ${packageCondition}
      ORDER BY p.service_id, p.sort_order, p.name
    `).bind(...serviceIds).all(),
    db.prepare(`
      SELECT * FROM service_addons a
      WHERE a.service_id IN (${placeholders}) ${includeInactive ? '' : 'AND a.is_active = 1'}
      ORDER BY a.service_id, a.sort_order, a.name
    `).bind(...serviceIds).all(),
  ]);

  const packageIds = packages.map((item) => item.id);
  let features = [];
  if (packageIds.length) {
    const featurePlaceholders = packageIds.map(() => '?').join(',');
    ({ results: features } = await db.prepare(`
      SELECT * FROM package_features
      WHERE package_id IN (${featurePlaceholders})
      ORDER BY package_id, sort_order
    `).bind(...packageIds).all());
  }

  const featuresByPackage = new Map();
  for (const feature of features) {
    if (!featuresByPackage.has(feature.package_id)) featuresByPackage.set(feature.package_id, []);
    featuresByPackage.get(feature.package_id).push(feature.feature_text);
  }

  const packagesByService = new Map();
  for (const pkg of packages) {
    if (!packagesByService.has(pkg.service_id)) packagesByService.set(pkg.service_id, []);
    packagesByService.get(pkg.service_id).push({ ...pkg, features: featuresByPackage.get(pkg.id) || [] });
  }

  const addonsByService = new Map();
  for (const addon of addons) {
    if (!addonsByService.has(addon.service_id)) addonsByService.set(addon.service_id, []);
    addonsByService.get(addon.service_id).push(addon);
  }

  return services.map((service) => ({
    ...service,
    packages: packagesByService.get(service.id) || [],
    addons: addonsByService.get(service.id) || [],
  }));
}
