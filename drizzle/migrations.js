// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_outstanding_elektra.sql';
import m0001 from './0001_mighty_night_nurse.sql';
import m0002 from './0002_unknown_iron_man.sql';
import m0003 from './0003_unusual_hellcat.sql';
import m0004 from './0004_left_whiplash.sql';
import m0005 from './0005_add_app_settings.sql';
import m0006 from './0006_add_theme_mode.sql';
import m0007 from './0007_component-lifetime-meters.sql';
import m0008 from './0008_migrate-component-lifetime-values.sql';
import m0009 from './0009_material_snowbird.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005,
m0006,
m0007,
m0008,
m0009
    }
  }
  