UPDATE `components`
SET `expected_lifetime_m` = `expected_lifetime_km` * 1000
WHERE `expected_lifetime_km` IS NOT NULL;
