// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_outstanding_elektra.sql';
import m0001 from './0001_mighty_night_nurse.sql';
import m0002 from './0002_unknown_iron_man.sql';
import m0003 from './0003_unusual_hellcat.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003
    }
  }
  