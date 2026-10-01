## [1.4.0](https://github.com/Pagiestm/Boardify/compare/v1.3.0...v1.4.0) (2026-10-01)

### Features

* **dashboard:** ajoute les échéances et la répartition par projet ([3472f41](https://github.com/Pagiestm/Boardify/commit/3472f41e09e923b6ea30dc3ff828a38bb28b54da))
* **dashboard:** des graphiques lisibles pour l'espace de travail ([01de1ae](https://github.com/Pagiestm/Boardify/commit/01de1aec6c5dca9a8200867caadbdb194fdfc58e))
* **projects:** permet de désigner les statuts finaux d'un tableau ([80372f3](https://github.com/Pagiestm/Boardify/commit/80372f35bf1ac4d0acae1d3908f57f7f5b840eb1))
* **tasks:** ajoute la vue frise ([ee2cd45](https://github.com/Pagiestm/Boardify/commit/ee2cd45156673ba3daa545461ae16738a292d93d))
* **tasks:** remplace les deux dates par un seul sélecteur de période ([418fe8f](https://github.com/Pagiestm/Boardify/commit/418fe8fb67d117858241d80a4e4070c31c956805))

### Bug Fixes

* **tasks:** répare l'enregistrement d'une tâche existante ([5813877](https://github.com/Pagiestm/Boardify/commit/58138770c352263c94f824af6f7622131d32e0f9))

## [1.3.0](https://github.com/Pagiestm/Boardify/compare/v1.2.0...v1.3.0) (2026-10-01)

### Features

* **dashboard:** ajoute la répartition par statut et la charge par personne ([d42e24d](https://github.com/Pagiestm/Boardify/commit/d42e24d480629061676f389ad49c973083d60b43))
* **labels:** affiche les étiquettes dans le détail et permet d'y filtrer ([0752df8](https://github.com/Pagiestm/Boardify/commit/0752df8cbbb386831c3f5c165d56c7ccfe8a6f0c))
* **labels:** ajoute les étiquettes aux tâches ([a32522e](https://github.com/Pagiestm/Boardify/commit/a32522e10627a2c555a0e5b62424d83c75c2dfdd))
* **navbar:** affiche le fil d'Ariane de la route courante ([422f6d0](https://github.com/Pagiestm/Boardify/commit/422f6d0bbe04ac44678848594459a5505231ddc5))
* **seo:** donne à chaque route son titre et ses métadonnées ([de6290c](https://github.com/Pagiestm/Boardify/commit/de6290c7d7014a33405d5134eb560064cb411ea9))
* **tasks:** des statuts propres à chaque projet ([d7433f9](https://github.com/Pagiestm/Boardify/commit/d7433f956e0c2b0d54c6a9aef126f75b4f05a170))
* **tasks:** permet de dupliquer une tâche ([aff193c](https://github.com/Pagiestm/Boardify/commit/aff193c0213d4307b1546198490ada073328e33a))

### Bug Fixes

* **auth:** fait démarrer le parcours OAuth depuis le navigateur ([88446d9](https://github.com/Pagiestm/Boardify/commit/88446d9e56ef21429be400e45d1414d5559792cc))
* **tasks:** aligne la validation et la suppression sur la base ([77e83e3](https://github.com/Pagiestm/Boardify/commit/77e83e35ced3255ef7c70e114a8449ddbecbc442))
* **tasks:** rétablit l'affichage du calendrier ([e80c4af](https://github.com/Pagiestm/Boardify/commit/e80c4af2a9fc3a3439211cc830d747623a8ac6bb))

## [1.2.0](https://github.com/Pagiestm/Boardify/compare/v1.1.1...v1.2.0) (2026-09-30)

### Features

* **lint:** passe à eslint 10 ([9323c89](https://github.com/Pagiestm/Boardify/commit/9323c894bd0c62f4e386b191fb711dd66407d360))

## [1.1.1](https://github.com/Pagiestm/Boardify/compare/v1.1.0...v1.1.1) (2026-09-30)

### Bug Fixes

* **ci:** permet à renovate de régénérer le lockfile ([d78a47b](https://github.com/Pagiestm/Boardify/commit/d78a47b9f3281b1896c9f232aef00d2dd87ddb65))

## [1.1.0](https://github.com/Pagiestm/Boardify/compare/v1.0.0...v1.1.0) (2026-09-30)

### Features

* **landing:** fluidifie la navigation du menu et l'ouverture de la FAQ ([3bec044](https://github.com/Pagiestm/Boardify/commit/3bec044949189e3d41375ec78b4a11d78f05c9c3))

## 1.0.0 (2026-09-29)

### Features

* **analytics:** :sparkles: Add project analytics feature with data fetching and display components ([00decc6](https://github.com/Pagiestm/Boardify/commit/00decc673a8ffc1248f2315b86225a2403ab5de3))
* **auth, sign-in-card, sign-up-card:** Creation of the sign in and sign up page + layout for these pages ([a1790d2](https://github.com/Pagiestm/Boardify/commit/a1790d21853f7c6b788a4768d74ef0df14d25413))
* **auth, user-button, actions.ts, Home:** Route protection, redirect + user button component to display logged in user info ([a025d8c](https://github.com/Pagiestm/Boardify/commit/a025d8c50991728500919e7e303cdc75f0ab69ec))
* **auth:** :sparkles: Add OAuth sign-up functionality with Google and GitHub; update sign-in and sign-up cards to include new sign-up methods ([1b56fe3](https://github.com/Pagiestm/Boardify/commit/1b56fe386ad24cf556b2ac9d669f849516869b54))
* **config, members, utils:** :sparkles: Creating the members table + creating workspace members + separating workspaces based on the authenticated user ([9693fb8](https://github.com/Pagiestm/Boardify/commit/9693fb8f2c5e7df5f4c9a8b076711959d2b0128f))
* **config.ts, route.ts, schemas.ts, tasks:** :sparkles: Creating the API for tasks ([8e32665](https://github.com/Pagiestm/Boardify/commit/8e3266523eee9e575c8f8b2fd64ef757d98d06a0))
* **edit-workspace-form, use-reset-invite-code:** :sparkles: creation of the reset system for the invitation to a workspace ([ea6e43b](https://github.com/Pagiestm/Boardify/commit/ea6e43bbdc4a3f64c4737895b552259fec8ea7b0))
* **edit-workspace-form, use-update-workspace:** :sparkles: Creating workspace settings to modify it ([079f7e4](https://github.com/Pagiestm/Boardify/commit/079f7e44eceac2084b3c9fcc6f2a760c06b6b6fa))
* **features/api:** create auth api ([f2fdcd3](https://github.com/Pagiestm/Boardify/commit/f2fdcd3cdf513da6cd4a20cfa1c2fd3cd23c371c))
* **features/Projects, components/Projects:** :sparkles: Adding projects to a workspace ([6989074](https://github.com/Pagiestm/Boardify/commit/6989074667fa5ff0ce080b736ba7754a519eb7bf))
* **features/workspaces, dashboard/workspaces, responsive-modal:** :sparkles: creating a responsive modal to create workspaces ([57ccb2b](https://github.com/Pagiestm/Boardify/commit/57ccb2bba859f9b755f14b99735ba50e50fd64a7))
* **join-workspace-form, use-join-workspace, use-invite-code:** :sparkles: added the functionality of inviting a member to a workspace ([d55d099](https://github.com/Pagiestm/Boardify/commit/d55d0997a536489a7f25ffb176b8e3be618a494a))
* **localization, ui:** :sparkles: Enhance French localization across the application; update UI components for better dark mode support and improve accessibility with consistent styling ([cb37549](https://github.com/Pagiestm/Boardify/commit/cb3754943d6d410dcb2c6d44eefbb5d047737441))
* **metadata:** :sparkles: Update app title and description for branding consistency ([7db1baf](https://github.com/Pagiestm/Boardify/commit/7db1bafb85ab6048d4961078a51be93f67b16fbf))
* **navbar, tasks:** :sparkles: Enhance Navbar with dynamic titles and descriptions based on route; update task view switcher to use project ID from hooks ([caedca5](https://github.com/Pagiestm/Boardify/commit/caedca59135bd4271275e0f13cee4f60ecaf9bf4))
* **projects, loading, error:** :sparkles: Implement project types, loading, and error pages across various components ([8eb78e0](https://github.com/Pagiestm/Boardify/commit/8eb78e0b4126b0999b6ec40dc7bf047d18da9d18))
* redesign the app and upgrade all dependencies ([7191d07](https://github.com/Pagiestm/Boardify/commit/7191d077b3178868a1912a9c4e76d7e5cb26bf65))
* **sidebar, mobile-sidebar, navigation:** creation of site navigation + normal sidebar and mobile version ([8646aa2](https://github.com/Pagiestm/Boardify/commit/8646aa276a015dc33f987413a746e6453f5dfe7f))
* **standalone, layout.tsx:** :sparkles: Building a standalone layout ([871b197](https://github.com/Pagiestm/Boardify/commit/871b197d1beb86258b1bcd61e32ac96ec14ca5c3))
* **tasks:** :sparkles: Add calendar view for task management with event cards and custom toolbar ([b241ba9](https://github.com/Pagiestm/Boardify/commit/b241ba9bdb554608de7da2451752119208c8de38))
* **tasks:** :sparkles: Add task actions component, enhance task types, and implement date formatting ([e77fb45](https://github.com/Pagiestm/Boardify/commit/e77fb450fe1e9acbacf66bd10fcd569245b18078))
* **tasks:** :sparkles: Add task detail page with loading and error handling, enhance task overview and filters ([e500ed5](https://github.com/Pagiestm/Boardify/commit/e500ed56b9b0b5153fe8fe942d7a7e8be2b56726))
* **tasks:** :sparkles: Add task priority feature with selection and display in task components ([e524fd1](https://github.com/Pagiestm/Boardify/commit/e524fd1d143057472db1cdb1fd1f8b9ca056a9e2))
* **tasks:** :sparkles: Enhance task retrieval with additional filters and loading state ([875672e](https://github.com/Pagiestm/Boardify/commit/875672e3ce6ddd5ee7e217046c1f89cf8be5b24f))
* **tasks:** :sparkles: Implement bulk update functionality for tasks with API integration and Kanban view support ([9161dac](https://github.com/Pagiestm/Boardify/commit/9161dac8232cd36f6e878c219c1b3b75a215c9ad))
* **tasks:** :sparkles: Implement create task modal and associated hooks ([e66219e](https://github.com/Pagiestm/Boardify/commit/e66219efbf84e100e329fc9ee2fa56b5b70ec133))
* **tasks:** :sparkles: Implement edit task modal with hooks for task retrieval and management ([5586f88](https://github.com/Pagiestm/Boardify/commit/5586f881379437cd78ea51681d7f159c87aa5df4))
* **tasks:** :sparkles: Implement Kanban board view for task management with drag-and-drop functionality ([f739863](https://github.com/Pagiestm/Boardify/commit/f73986385d8ae0c2d24d11ff86715d0a9706fe72))
* **ui:** :sparkles: Update navigation layout to enhance branding with logo and title; improve accessibility with consistent styling ([9c0c589](https://github.com/Pagiestm/Boardify/commit/9c0c589b244c50658e1cac9511a11073242c1755))
* **use_current, use-logout, session-middleware:** creating a middleware to manage user session + logout ([d7cb0c4](https://github.com/Pagiestm/Boardify/commit/d7cb0c4ae556872e8e28f251db7ff06e2ce0a020))
* **use-delete-member, use-update-member, members-list, page:** :sparkles: creation of the members page modification of a members and deletion in a workspace ([6402bdc](https://github.com/Pagiestm/Boardify/commit/6402bdc95ba0f6c999f75938a9c3e88a95afc945))
* **workspace-switcher, workspace-avatar, use-get-workspaces:** :sparkles: Recovering all workspaces + Creating a workspace switcher ([40742a8](https://github.com/Pagiestm/Boardify/commit/40742a8c3b747cd02b9f5205eeb2c11e1b19ff3f))
* **workspaces, config.ts:** :sparkles: Image download management + database saving ([70dbdcf](https://github.com/Pagiestm/Boardify/commit/70dbdcf8d7583aaa59607d6b2d12a0f5599d5ec2))
* **workspaces, hooks:** :sparkles: Added workspace deletion functionality ([1c12209](https://github.com/Pagiestm/Boardify/commit/1c122092b1b490bc89edbacd67df7869cf55fdf6))
* **workspaces:** :sparkles: Add workspace analytics endpoint with task statistics and performance metrics ([5b6a173](https://github.com/Pagiestm/Boardify/commit/5b6a17313de8efda33bf13144d4c8b274ed2ff72))
* **workspaces:** creation of the creation form for workspaces, saving in database plus popup error or confirmation message with toast to ring ([fa193eb](https://github.com/Pagiestm/Boardify/commit/fa193eb367d287ef6b2a92a3697d754b30304b0f))

### Bug Fixes

* **edit-task-form:** improve date handling in task edit form ([faa21fc](https://github.com/Pagiestm/Boardify/commit/faa21fc4d4dd68bd5267fd48d3cb83d1b501849c))
* **localization:** :bug: Correct French text in SignUpCard to use HTML entity for apostrophe ([59b7ebb](https://github.com/Pagiestm/Boardify/commit/59b7ebb44739480eec15f5bb182b5d23c99be4a6))
* **localization:** :bug: Simplify button text in French forms for consistency and clarity ([e6943d8](https://github.com/Pagiestm/Boardify/commit/e6943d8cc0a3a481fabf6b5287b02773a721e514))
* **localization:** :bug: Update French text for consistency and clarity; add image size validation in project forms ([c90ac25](https://github.com/Pagiestm/Boardify/commit/c90ac2504c0b0e66f86d3ab87c95d9b120fe7662))
* **localization:** :bug: Update French text to use HTML entities for apostrophes in various components ([a1669d1](https://github.com/Pagiestm/Boardify/commit/a1669d15e7ad27bda07cca1cc1b5964b525123c8))
* **oauth:** :bug: Update redirect URLs to use NEXT_PUBLIC_APP environment variable instead of request origin ([def10ae](https://github.com/Pagiestm/Boardify/commit/def10ae3bf03dacff221b12686bf377f6a1be0c7))
* **oauth:** :bug: Update redirect URLs to use request origin instead of NEXT_PUBLIC_APP environment variable ([4c4e9d0](https://github.com/Pagiestm/Boardify/commit/4c4e9d06cbac04169621c64cb7fb424d917187b4))
* **release:** pin conventionalcommits preset to v9 ([c1fdda5](https://github.com/Pagiestm/Boardify/commit/c1fdda52b010d89a553038ee15825d2d01a34ede))
* **tasks, auth, workspaces:** :bug: Invalidate additional queries for project and workspace analytics on task and workspace mutations ([e2394a5](https://github.com/Pagiestm/Boardify/commit/e2394a5fc2252576cda739bfd528d64f540b1cb6))
* **tasks:** :bug: Correct date formatting in TaskDate component to use endDate instead of value ([892a136](https://github.com/Pagiestm/Boardify/commit/892a13683466351c888820a6ea2418ceb155a2c9))
* **ui:** :bug: Update tertiary button variant styles for improved visibility and consistency ([8ae1583](https://github.com/Pagiestm/Boardify/commit/8ae15835311b242c0812a1eeb47f15e71407c1ea))
* **validation:** :bug: Add image size validation for project and workspace creation and update; improve error handling for image size limit ([e4c0514](https://github.com/Pagiestm/Boardify/commit/e4c05145cfd00f86572b21736843cd7b92cea9ce))
* **validation:** :bug: Remove toast error message for image size limit in project and workspace creation and update ([39b1dbe](https://github.com/Pagiestm/Boardify/commit/39b1dbe3f9e0771a7c44687fbda0ee3e2414b6d9))
