import Link from "next/link";
import {
  BellIcon,
  HouseIcon,
  ListChecksIcon,
  SearchIcon,
  SettingsIcon,
  SunMoonIcon,
  UsersIcon,
} from "lucide-react";

import { Demo } from "./demo/demos";

import { Bullets, Chapter, Keys, Part, Preview, Steps, Table, Text, Tip, Ui } from "./guide-blocks";

const InterfaceMap = () => (
  <Preview className="p-0 sm:p-0">
    <div className="grid grid-cols-[150px_1fr] text-xs sm:grid-cols-[190px_1fr]">
      <div className="flex flex-col gap-1 border-r bg-background p-3">
        <span className="mb-2 rounded-md border px-2 py-1.5 font-medium">Équipe produit ▾</span>
        {[
          { icon: HouseIcon, label: "Accueil" },
          { icon: ListChecksIcon, label: "Mes tâches" },
          { icon: UsersIcon, label: "Membres" },
          { icon: SettingsIcon, label: "Paramètres" },
        ].map(({ icon: Icon, label }) => (
          <span key={label} className="flex items-center gap-2 rounded-md px-2 py-1.5">
            <Icon className="size-3.5 text-muted-foreground" />
            {label}
          </span>
        ))}
        <span className="mt-3 flex items-center justify-between px-2 font-medium text-muted-foreground">
          Projets <span>+</span>
        </span>
        {["Site vitrine", "App mobile"].map((project) => (
          <span key={project} className="truncate rounded-md px-2 py-1.5">
            {project}
          </span>
        ))}
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2 border-b bg-background px-3 py-2.5">
          <span className="font-semibold">Accueil</span>
          <span className="ml-auto hidden items-center gap-1.5 rounded-md border px-2 py-1 text-muted-foreground sm:flex">
            <SearchIcon className="size-3" />
            Rechercher… ⌘K
          </span>
          <BellIcon className="size-3.5 text-muted-foreground max-sm:ml-auto" />
          <SunMoonIcon className="size-3.5 text-muted-foreground" />
          <span className="size-5 rounded-full bg-primary/20" />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 p-3">
          {["Ma journée", "Échéances", "Charge par personne", "Tâches assignées"].map((card) => (
            <span
              key={card}
              className="flex min-h-14 items-start rounded-md border bg-background p-2 text-muted-foreground"
            >
              {card}
            </span>
          ))}
        </div>
      </div>
    </div>
  </Preview>
);

export const GuideContent = () => (
  <>
    <Chapter id="demarrer">
      <Part title="Créer votre compte">
        <Steps>
          {[
            <>
              Rendez-vous sur{" "}
              <Link href="/sign-up" className="underline underline-offset-4">
                Créer un compte
              </Link>
              .
            </>,
            <>
              Choisissez <Ui>Continuer avec Google</Ui>, <Ui>Continuer avec GitHub</Ui>, ou
              renseignez votre nom, votre adresse e-mail et un mot de passe de 8 caractères minimum.
            </>,
            <>
              Cliquez sur <Ui>Créer mon compte</Ui>. Boardify est gratuit, sans carte bancaire.
            </>,
          ]}
        </Steps>
      </Part>

      <Part title="Créer votre premier espace de travail">
        <Text>
          Un espace de travail regroupe une équipe, ses projets et ses tâches. À la première
          connexion, Boardify vous propose d&apos;en créer un.
        </Text>
        <Steps>
          {[
            <>
              Donnez-lui un nom, par exemple <Ui>Équipe produit</Ui>, et éventuellement une icône
              (PNG, JPG ou SVG, 1 Mo maximum).
            </>,
            <>
              Cliquez sur <Ui>Créer</Ui>. Vous en devenez automatiquement l&apos;administrateur.
            </>,
          ]}
        </Steps>
        <Tip>
          Vous pouvez appartenir à plusieurs espaces : passez de l&apos;un à l&apos;autre avec le
          sélecteur en haut de la barre latérale, ou créez-en un nouveau avec son bouton <Ui>+</Ui>.
        </Tip>
      </Part>

      <Part title="Se repérer dans l'interface">
        <InterfaceMap />
        <Bullets>
          {[
            <>
              <Ui>La barre latérale</Ui> : l&apos;espace en cours, <Ui>Accueil</Ui>,{" "}
              <Ui>Mes tâches</Ui>, <Ui>Membres</Ui>, <Ui>Paramètres</Ui>, puis la liste de vos
              projets.
            </>,
            <>
              <Ui>La barre du haut</Ui> : la recherche <Keys k="⌘K" />, la cloche des notifications,
              le thème (Clair, Sombre ou Système) et le menu de votre compte.
            </>,
            <>Sur mobile, le bouton menu en haut à gauche ouvre la barre latérale.</>,
            <>
              Tout se met à jour en direct : les changements de vos collègues apparaissent en
              quelques secondes, sans recharger la page.
            </>,
          ]}
        </Bullets>
      </Part>
    </Chapter>

    <Chapter id="equipe">
      <Part title="Inviter des membres">
        <Demo id="invite-member" />
        <Steps>
          {[
            <>
              Ouvrez <Ui>Paramètres</Ui> dans la barre latérale.
            </>,
            <>
              Dans <Ui>Inviter des membres</Ui>, copiez le lien d&apos;invitation et envoyez-le à
              vos collègues.
            </>,
            <>
              En ouvrant le lien, ils voient l&apos;invitation et cliquent sur{" "}
              <Ui>Rejoindre l&apos;espace</Ui>.
            </>,
          ]}
        </Steps>
        <Tip tone="warning">
          Une personne qui n&apos;a pas encore de compte doit d&apos;abord s&apos;inscrire, puis
          rouvrir le lien d&apos;invitation. Si le lien a circulé trop largement, cliquez sur{" "}
          <Ui>Réinitialiser le lien</Ui> : l&apos;ancien cesse de fonctionner.
        </Tip>
      </Part>

      <Part title="Les rôles">
        <Text>
          Dans <Ui>Membres</Ui>, le menu <Ui>…</Ui> de chaque personne permet de la{" "}
          <Ui>Définir comme administrateur</Ui>, de la <Ui>Définir comme membre</Ui> ou de la
          retirer de l&apos;espace.
        </Text>
        <Table
          head={["Rôle", "Ce qu'il peut faire"]}
          rows={[
            [
              "Membre",
              "Créer, modifier et supprimer projets, tâches, sprints et étiquettes ; commenter ; créer des modèles de tâche.",
            ],
            [
              "Admin",
              "Tout ce que fait un membre, plus : renommer ou supprimer l'espace, gérer les rôles et les membres, réinitialiser le lien d'invitation, connecter GitHub, configurer l'assistant IA, supprimer des modèles.",
            ],
          ]}
        />
      </Part>
    </Chapter>

    <Chapter id="projets">
      <Part title="Créer un projet">
        <Steps>
          {[
            <>
              Cliquez sur le <Ui>+</Ui> à côté de <Ui>Projets</Ui> dans la barre latérale, ou
              appuyez sur <Keys k="P" />.
            </>,
            <>
              Donnez-lui un nom et une icône, puis cliquez sur <Ui>Créer</Ui>.
            </>,
          ]}
        </Steps>
        <Text>
          La page du projet affiche ses tâches dans quatre vues, la barre des sprints et, en haut à
          droite, le bouton <Ui>Paramètres</Ui> pour le renommer, le relier à un dépôt GitHub ou le
          supprimer.
        </Text>
      </Part>

      <Part title="Adapter les colonnes">
        <Text>
          Chaque projet démarre avec cinq statuts : <Ui>Backlog</Ui>, <Ui>À faire</Ui>,{" "}
          <Ui>En cours</Ui>, <Ui>En revue</Ui> et <Ui>Terminé</Ui>. Dans la vue Kanban, le menu{" "}
          <Ui>…</Ui> d&apos;une colonne permet de :
        </Text>
        <Bullets>
          {[
            <>
              la <Ui>Renommer</Ui>, changer sa <Ui>Couleur</Ui> ou la déplacer (glissez aussi la
              poignée de l&apos;en-tête) ;
            </>,
            <>
              la <Ui>Marquer comme statut final</Ui> : une tâche qui y arrive est considérée comme
              terminée ;
            </>,
            <>
              la <Ui>Masquer</Ui> ou la <Ui>Supprimer</Ui> : Boardify vous demande alors où déplacer
              ses tâches.
            </>,
            <>
              <Ui>Ajouter un statut</Ui> crée une nouvelle colonne, et le <Ui>+</Ui> d&apos;une
              colonne y crée directement une tâche.
            </>,
          ]}
        </Bullets>
      </Part>
    </Chapter>

    <Chapter id="taches">
      <Part title="Créer une tâche">
        <Demo id="create-task" />
        <Steps>
          {[
            <>
              Appuyez sur <Keys k="N" /> n&apos;importe où, ou cliquez sur <Ui>Nouvelle tâche</Ui>.
            </>,
            <>
              Renseignez le nom, le statut, la priorité (<Ui>Haute</Ui>, <Ui>Moyenne</Ui>,{" "}
              <Ui>Basse</Ui>), la personne assignée, la <Ui>Période</Ui> (début et échéance) et le
              projet.
            </>,
            <>
              Ajoutez si besoin une description, des <Ui>Étiquettes</Ui>, un <Ui>Sprint</Ui>, une{" "}
              <Ui>Estimation</Ui> en points, une <Ui>Répétition</Ui> ou les tâches qui la bloquent (
              <Ui>Bloquée par</Ui>).
            </>,
            <>
              Cliquez sur <Ui>Créer</Ui>.
            </>,
          ]}
        </Steps>
        <Tip>
          Les étiquettes sont partagées par tout l&apos;espace : tapez un nom dans le sélecteur{" "}
          <Ui>Étiquettes</Ui> puis <Keys k="↵" /> pour en créer une nouvelle.
        </Tip>
      </Part>

      <Part title="La page d'une tâche">
        <Text>
          Ouvrez une tâche avec le menu <Ui>…</Ui> d&apos;une ligne ou d&apos;une carte, puis{" "}
          <Ui>Voir la tâche</Ui>. Vous y trouvez :
        </Text>
        <Bullets>
          {[
            <>
              <Ui>Description</Ui> : <Ui>Modifier</Ui> ou <Keys k="I" />, puis <Keys k="⌘S" /> pour
              enregistrer.
            </>,
            <>
              <Ui>Sous-tâches</Ui> : une liste à cocher avec sa barre de progression. Tapez un titre
              puis <Keys k="↵" /> pour en ajouter une.
            </>,
            <>
              <Ui>Pièces jointes</Ui> : glissez un fichier ou cliquez sur <Ui>Ajouter</Ui> (10 Mo
              maximum).
            </>,
            <>
              <Ui>Activité</Ui> : l&apos;historique de chaque changement et les commentaires. Tapez{" "}
              <Ui>@</Ui> pour mentionner quelqu&apos;un, <Keys k="⌘↵" /> pour envoyer.
            </>,
            <>
              <Ui>Détails</Ui> : statut, priorité, échéance, sprint, dépendances… <Keys k="E" />{" "}
              pour les modifier.
            </>,
          ]}
        </Bullets>
      </Part>

      <Part title="Modèles et tâches répétées">
        <Bullets>
          {[
            <>
              <Ui>Modèle</Ui>, en haut de la page d&apos;une tâche, l&apos;enregistre comme modèle :
              description, priorité, étiquettes, estimation, répétition et sous-tâches. À la
              création d&apos;une tâche, choisissez-le dans <Ui>Partir d&apos;un modèle</Ui>.
            </>,
            <>
              Une tâche avec une <Ui>Répétition</Ui> (chaque jour, semaine ou mois) recrée la
              suivante dès qu&apos;elle est terminée, avec des dates décalées et des sous-tâches
              décochées.
            </>,
            <>
              Le menu <Ui>…</Ui> propose aussi <Ui>Dupliquer</Ui> pour copier une tâche.
            </>,
          ]}
        </Bullets>
      </Part>
    </Chapter>

    <Chapter id="vues">
      <Part title="Quatre façons de voir vos tâches">
        <Demo id="move-card" />
        <Table
          head={["Vue", "Pour quoi faire", "Touche"]}
          rows={[
            [
              "Tableau",
              "Lister, trier par colonne et rechercher une tâche par son nom.",
              <Keys key="1" k="1" />,
            ],
            ["Kanban", "Faire glisser les cartes d'une colonne à l'autre.", <Keys key="2" k="2" />],
            ["Calendrier", "Voir les échéances du mois.", <Keys key="3" k="3" />],
            [
              "Frise",
              "Visualiser les périodes, les retards et les dépendances.",
              <Keys key="4" k="4" />,
            ],
          ]}
        />
      </Part>

      <Part title="Filtrer et enregistrer une vue">
        <Demo id="saved-view" />
        <Text>
          Au-dessus des tâches, filtrez par statut, membre, projet, étiquette ou échéance.{" "}
          <Ui>Réinitialiser</Ui> efface tous les filtres. Pour retrouver une combinaison en un clic,
          ouvrez <Ui>Vues</Ui> puis <Ui>Enregistrer la vue actuelle…</Ui> : la vue, les filtres et
          le sprint sont mémorisés dans <Ui>Mes vues</Ui>, propres à chacun.
        </Text>
        <Tip>
          <Ui>Mes tâches</Ui> affiche toutes les tâches de l&apos;espace. Choisissez votre nom dans{" "}
          <Ui>Tous les membres</Ui>, puis enregistrez la vue pour retrouver uniquement les vôtres.
        </Tip>
      </Part>
    </Chapter>

    <Chapter id="sprints">
      <Demo id="sprint" />
      <Part title="Créer un sprint">
        <Steps>
          {[
            <>
              Sur la page d&apos;un projet, cliquez sur <Ui>Nouveau sprint</Ui>.
            </>,
            <>
              Le nom et les dates sont proposés (deux semaines après le sprint précédent). Ajoutez
              un <Ui>Objectif</Ui>, puis <Ui>Créer le sprint</Ui>.
            </>,
            <>
              Ajoutez des tâches au sprint avec leur champ <Ui>Sprint</Ui>. Une tâche créée pendant
              qu&apos;un sprint est sélectionné y est ajoutée automatiquement.
            </>,
          ]}
        </Steps>
      </Part>

      <Part title="Suivre et terminer un sprint">
        <Text>
          Sélectionnez un sprint pour filtrer toutes les vues. Son panneau affiche l&apos;objectif,
          les jours restants, la progression en tâches et en points, et la charge restante de chaque
          membre.
        </Text>
        <Text>
          À la fin, cliquez sur <Ui>Terminer</Ui> : les tâches non terminées sont reportées vers le
          sprint de votre choix, ou remises dans le backlog.
        </Text>
      </Part>
    </Chapter>

    <Chapter id="accueil">
      <Part title="Votre tableau de bord">
        <Text>
          <Ui>Accueil</Ui> (<Keys k="G" then="H" />) donne une vue d&apos;ensemble de l&apos;espace
          :
        </Text>
        <Bullets>
          {[
            <>
              les tâches créées ce mois-ci, et celles qui vous sont assignées, comparées au mois
              dernier ;
            </>,
            <>
              les <Ui>Échéances</Ui> : en retard, aujourd&apos;hui, 7 prochains jours, plus tard ;
            </>,
            <>
              les tâches par projet et la <Ui>Charge par personne</Ui> ;
            </>,
            <>
              la <Ui>Charge des prochaines semaines</Ui> de chaque membre, en tâches ou en points ;
            </>,
            <>vos tâches assignées, les projets et les membres de l&apos;espace.</>,
          ]}
        </Bullets>
      </Part>
    </Chapter>

    <Chapter id="notifications">
      <Part title="Les notifications">
        <Text>La cloche, en haut de l&apos;écran, vous prévient quand :</Text>
        <Bullets>
          {[
            "quelqu'un vous assigne une tâche ;",
            "quelqu'un vous mentionne avec @ dans un commentaire ;",
            "une tâche qui vous est assignée reçoit un commentaire ;",
            "une de vos tâches arrive à échéance demain (rappel envoyé chaque matin).",
          ]}
        </Bullets>
        <Text>
          Cliquez sur une notification pour ouvrir la tâche, ou sur <Ui>Tout marquer comme lu</Ui>.
        </Text>
      </Part>

      <Part title="Vos échéances dans votre agenda">
        <Steps>
          {[
            <>
              Dans la vue <Ui>Calendrier</Ui>, cliquez sur <Ui>S&apos;abonner</Ui>.
            </>,
            <>
              Cliquez sur <Ui>Créer mon lien d&apos;abonnement</Ui>, puis{" "}
              <Ui>Ouvrir dans Calendrier</Ui> ou copiez le lien.
            </>,
            <>
              Dans Google Agenda : <Ui>Autres agendas</Ui> → <Ui>À partir de l&apos;URL</Ui>, puis
              collez le lien.
            </>,
          ]}
        </Steps>
        <Text>
          Vos tâches assignées apparaissent le jour de leur échéance, et les tâches terminées sont
          marquées d&apos;un ✓.
        </Text>
        <Tip tone="warning">
          Ce lien est personnel. S&apos;il a été partagé par erreur, cliquez sur <Ui>Régénérer</Ui>{" "}
          ou <Ui>Désactiver</Ui>.
        </Tip>
      </Part>
    </Chapter>

    <Chapter id="github">
      <Demo id="github-sync" />
      <Part title="Connecter GitHub">
        <Steps>
          {[
            <>
              Un administrateur ouvre <Ui>Paramètres</Ui> → <Ui>GitHub</Ui> →{" "}
              <Ui>Connecter GitHub</Ui> et choisit les dépôts accessibles.
            </>,
            <>
              Chaque membre peut cliquer sur <Ui>Lier mon compte GitHub</Ui> : les issues de ses
              tâches lui seront assignées sur GitHub.
            </>,
            <>
              Dans les paramètres d&apos;un projet, choisissez son <Ui>Dépôt GitHub</Ui>, puis{" "}
              <Ui>Importer les issues</Ui> pour reprendre celles déjà ouvertes.
            </>,
          ]}
        </Steps>
      </Part>

      <Part title="Ce qui est synchronisé">
        <Bullets>
          {[
            "Chaque nouvelle tâche crée une issue, avec ses étiquettes, sa priorité et une milestone au nom du projet.",
            "Terminer la tâche ferme l'issue ; fermer l'issue, ou merger une pull request qui la ferme (« Fixes #12 »), termine la tâche.",
            "Les modifications du titre et de la description, et les commentaires, passent dans les deux sens.",
            <>
              La carte <Ui>Développement</Ui> d&apos;une tâche liste ses branches et pull requests,
              et <Ui>Créer une branche</Ui> en crée une au bon nom.
            </>,
          ]}
        </Bullets>
      </Part>
    </Chapter>

    <Chapter id="assistant">
      <Part title="Brancher votre IA">
        <Steps>
          {[
            <>
              Un administrateur ouvre <Ui>Paramètres</Ui> → <Ui>Assistant IA</Ui>.
            </>,
            <>
              Il choisit le <Ui>Fournisseur</Ui> (OpenAI, Anthropic, Mistral, Google Gemini ou un
              service compatible OpenAI) et colle sa <Ui>Clé d&apos;API</Ui>. Le lien{" "}
              <Ui>Obtenir une clé</Ui> mène à la bonne page.
            </>,
            <>
              Il choisit le <Ui>Modèle</Ui>, clique sur <Ui>Tester la connexion</Ui>, puis{" "}
              <Ui>Enregistrer</Ui>.
            </>,
          ]}
        </Steps>
        <Tip>
          La clé est chiffrée et n&apos;est jamais réaffichée. Les échanges sont facturés par votre
          fournisseur : Google Gemini propose une offre gratuite pour essayer.
        </Tip>
      </Part>

      <Part title="Préparer sa journée">
        <Demo id="focus-day" />
      </Part>
      <Part title="Compléter une tâche">
        <Demo id="ai-complete" />
      </Part>
      <Part title="Créer des tâches depuis un texte">
        <Demo id="ai-from-text" />
      </Part>
      <Part title="Où l'utiliser">
        <Table
          head={["Où", "Ce que fait l'assistant"]}
          rows={[
            [
              "Accueil",
              <>
                <Ui>Préparer ma journée</Ui> : vos tâches prioritaires du jour, avec la raison de
                chaque choix. La liste est gardée jusqu&apos;au lendemain.
              </>,
            ],
            [
              "Recherche ⌘K",
              <>
                Tapez une question comme « ce qui est en retard sur le site », puis{" "}
                <Ui>Demander à l&apos;IA</Ui>.
              </>,
            ],
            [
              "Nouvelle tâche",
              <>
                <Ui>Compléter avec l&apos;IA</Ui> propose description, sous-tâches, priorité et
                estimation à partir du nom.
              </>,
            ],
            [
              "Page d'une tâche",
              <>
                <Ui>Rédiger avec l&apos;IA</Ui> la description, <Ui>Suggérer</Ui> des sous-tâches,{" "}
                <Ui>Résumer la discussion</Ui> et <Ui>Suggérer une réponse</Ui>.
              </>,
            ],
            [
              "Projet → Assistant",
              <>
                <Ui>Point d&apos;avancement</Ui>, <Ui>Bilan de la période</Ui>,{" "}
                <Ui>Notes de version</Ui>, <Ui>Créer depuis un texte</Ui> (compte rendu, e-mail…) et{" "}
                <Ui>Estimer les tâches</Ui>.
              </>,
            ],
            [
              "Sprint",
              <>
                <Ui>Planifier</Ui> choisit les tâches du backlog selon l&apos;objectif et la charge
                de chacun.
              </>,
            ],
            [
              "Ajout rapide",
              <>
                Dans l&apos;application desktop, <Ui>Interpréter</Ui> (<Keys k="⌘I" />) remplit les
                champs à partir d&apos;une phrase.
              </>,
            ],
          ]}
        />
        <Text>
          Rien n&apos;est créé ni modifié sans votre validation : chaque proposition peut être
          relue, ajustée ou ignorée.
        </Text>
      </Part>
    </Chapter>

    <Chapter id="desktop">
      <Demo id="quick-add" />
      <Part title="Installer l'application">
        <Text>
          Téléchargez-la depuis la page{" "}
          <Link href="/download" className="underline underline-offset-4">
            Application desktop
          </Link>{" "}
          pour macOS, Windows ou Linux, puis connectez-vous comme sur le site. Elle se met à jour
          toute seule.
        </Text>
      </Part>
      <Part title="Ce qu'elle ajoute">
        <Bullets>
          {[
            <>
              <Ui>L&apos;ajout rapide</Ui> : <Keys k="⌃⌥N" /> (Ctrl+Alt+N sous Windows et Linux)
              ouvre une petite fenêtre depuis n&apos;importe quelle application. Tapez la tâche,
              choisissez le projet et l&apos;échéance, puis <Keys k="↵" />.
            </>,
            <>
              <Ui>La barre des menus</Ui> : vos tâches du jour et en retard, à portée de clic.
              Fermer la fenêtre garde Boardify disponible.
            </>,
            <>
              <Ui>Les notifications natives</Ui> et une pastille sur l&apos;icône avec le nombre de
              notifications non lues.
            </>,
          ]}
        </Bullets>
      </Part>
    </Chapter>

    <Chapter id="raccourcis">
      <Part title="La palette ⌘K">
        <Demo id="command-palette" />
        <Text>
          <Keys k="⌘K" /> (Ctrl+K sous Windows et Linux) ouvre la palette : allez à une page ou à un
          projet, créez une tâche, un projet ou un espace, changez de thème ou d&apos;espace de
          travail. Avec l&apos;assistant IA, posez aussi une question sur vos tâches.
        </Text>
      </Part>
      <Part title="Tous les raccourcis">
        <Table
          head={["Raccourci", "Action"]}
          rows={[
            [<Keys key="k" k="⌘K" />, "Ouvrir la recherche"],
            [<Keys key="n" k="N" />, "Nouvelle tâche"],
            [<Keys key="p" k="P" />, "Nouveau projet"],
            [<Keys key="gh" k="G" then="H" />, "Aller à l'accueil"],
            [<Keys key="gt" k="G" then="T" />, "Aller à mes tâches"],
            [<Keys key="gs" k="G" then="S" />, "Aller aux paramètres"],
            [<Keys key="gm" k="G" then="M" />, "Aller aux membres"],
            [<Keys key="v" k="1 – 4" />, "Changer de vue : Tableau, Kanban, Calendrier, Frise"],
            [<Keys key="e" k="E" />, "Modifier la tâche ouverte"],
            [<Keys key="i" k="I" />, "Modifier sa description"],
            [<Keys key="enter" k="⌘↵" />, "Envoyer un commentaire"],
            [<Keys key="q" k="⌃⌥N" />, "Ajout rapide (application desktop)"],
            [<Keys key="h" k="?" />, "Afficher les raccourcis"],
          ]}
        />
        <Tip>
          Les raccourcis sont désactivés pendant la saisie dans un champ. <Keys k="?" /> les
          rappelle à tout moment.
        </Tip>
      </Part>
    </Chapter>
  </>
);
