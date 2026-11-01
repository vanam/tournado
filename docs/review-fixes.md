# Review corrections

The application appearance is unchanged. The review snapshot was `e993f3b`.

| Finding | Correction |
| --- | --- |
| 1. Main/consolation match IDs collide | Score operations carry the selected playoff section, including for existing saved brackets. |
| 2. Cyclic seed replacements collapse players | Apply replacements simultaneously against original slot IDs. |
| 3. Swiss doubles become singles | Generate subsequent rounds and progress from participants. |
| 4. Points retirement saves the wrong winner | Treat walkover sentinels consistently when determining the saved winner. |
| 5. Custom groups/team order disappear | Creation transmits explicit membership indices and remaps them to persisted IDs. |
| 6. Legacy migration skips old data | Read v2/v3 library layouts and v4/v5 stores, normalize versions, preserve existing destination records, check write errors, retry failed migrations. |
| 7. Concurrent writes overwrite changes | Mutate the latest document inside incremental callbacks. Bulk group deletion uses the dedicated operation. |
| 8. Fullscreen hides score dialogs | Portal dialogs inside the active fullscreen element. |
| 9. Completed tournaments remain active | Share completion/winner derivation between writes, summaries and profiles. |
| 10. Group double elimination announces an early champion | Use the existing double-elimination winner helper. |
| 11. Swiss pairing ignores scoring settings | Pass the configured scoring mode and maximum sets. |
| 12. Lucky-loser lottery does not sort | Retain the actual sorted order. |
| 13. Round-robin ranks ignore head-to-head | Include resolved head-to-head criteria in rank equivalence. |
| 14. Final results ignore set limit | Carry maximum sets through round-robin result options. |
| 15. Inactive reset prevents 100% progress | Exclude an unused reset from completed double-elimination progress. |
| 16. Invalid import envelope crashes preview | Validate envelope and entity versions before preview. |
| 17. Invalid tournament imports overwrite valid data | Validate compatible entities against schemas and format-specific guards before any write. |
| 18. Group order is not persisted | Store ordering with a versioned RxDB schema migration and consistent reads. |
| 19. Doubles member profiles omit placement | Resolve team results through participant membership. |
| 20. Library ELO cannot be cleared | Explicit null in update patches removes ELO. |
| 21. Nested card actions fail with the keyboard | Only handle card keyboard activation when the card itself is the event target. |

Focused tests cover tournament algorithms, real RxDB memory-storage service operations, concurrent writes, creation membership, imports, profiles and legacy migration layouts. Migration tests simulate IndexedDB read requests and use the real destination collections. They never open the user's IndexedDB database.

## Dependency compatibility

The dependency update uses current stable releases eligible under the machine's npm release-age setting. Four development packages remain on the newest mutually compatible versions:

- TypeScript 6.0.3: `typescript-eslint` supports TypeScript below 6.1. [Supported versions](https://typescript-eslint.io/users/dependency-versions/).
- ESLint and `@eslint/js` 9.39.5: the existing React, accessibility and import plugins do not advertise ESLint 10 support.
- `eslint-plugin-unicorn` 65.0.1: newer releases require ESLint 10.

No peer dependency checks or lint rules are disabled. The filename rule retains its existing filename-only scope using the new `checkDirectories` option. DOMPurify's deprecated standalone type package was removed because the library includes its types.
