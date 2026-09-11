/**
 * Composed message catalogues. The CORE (uz.ts / ru.ts) covers common, auth, nav,
 * errors and the shell; each app module contributes its own catalogue file under
 * ./modules so large areas can be translated independently without editing one
 * giant file. All fragments are merged here into the single `uz` / `ru` objects
 * the provider consumes.
 *
 * Uzbek (uz) is the SOURCE OF TRUTH for keys; a compile-time assertion below fails
 * the build if uz and ru ever diverge (missing or extra keys, in any fragment).
 */
import { uz as coreUz } from './uz';
import { ru as coreRu } from './ru';

// Module fragments (each pair is key-parity-checked in its own file).
import { adminUsersUz } from './modules/admin-users.uz';
import { adminUsersRu } from './modules/admin-users.ru';
import { adminTemplatesUz } from './modules/admin-templates.uz';
import { adminTemplatesRu } from './modules/admin-templates.ru';
import { adminRiskUz } from './modules/admin-risk.uz';
import { adminRiskRu } from './modules/admin-risk.ru';
import { jobsAUz } from './modules/jobs-a.uz';
import { jobsARu } from './modules/jobs-a.ru';
import { jobsBUz } from './modules/jobs-b.uz';
import { jobsBRu } from './modules/jobs-b.ru';
import { catalogUz } from './modules/catalog.uz';
import { catalogRu } from './modules/catalog.ru';
import { miscUz } from './modules/misc.uz';
import { miscRu } from './modules/misc.ru';

export const uz = {
  ...coreUz,
  ...adminUsersUz,
  ...adminTemplatesUz,
  ...adminRiskUz,
  ...jobsAUz,
  ...jobsBUz,
  ...catalogUz,
  ...miscUz,
} as const;

export const ru = {
  ...coreRu,
  ...adminUsersRu,
  ...adminTemplatesRu,
  ...adminRiskRu,
  ...jobsARu,
  ...jobsBRu,
  ...catalogRu,
  ...miscRu,
};

// --- Compile-time key-parity guard (uz keys === ru keys) --------------------
type UzKey = keyof typeof uz;
type RuKey = keyof typeof ru;
type Extends<A, B> = [A] extends [B] ? true : false;
type SameKeys = Extends<UzKey, RuKey> extends true ? Extends<RuKey, UzKey> : false;
// If this line errors, uz and ru have diverged somewhere.
const _parity: SameKeys = true;
void _parity;
