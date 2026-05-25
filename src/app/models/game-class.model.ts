/** Represents a Wakfu class definition */
export interface GameClass {
  id: string;
  name: string;
  image: string;
}

/** Represents a class slot in a team (class + alive/dead state) */
export interface TeamSlot {
  gameClass: GameClass;
  isDead: boolean;
}

/** Represents the full game state persisted to localStorage */
export interface GameState {
  leftTeam: TeamSlot[];
  rightTeam: TeamSlot[];
  leftTeamName?: string;
  rightTeamName?: string;
  overlayEditEnabled?: boolean;
}

/** The 18 Wakfu classes with placeholder images */
export const WAKFU_CLASSES: GameClass[] = [
  { id: 'cra',         name: 'Cra',         image: 'assets/classes/cra.png'},
  { id: 'ecaflip',     name: 'Ecaflip',     image: 'assets/classes/ecaflip.png'},
  { id: 'eliotrope',   name: 'Éliotrope',   image: 'assets/classes/eliotrope.png'},
  { id: 'eniripsa',    name: 'Eniripsa',    image: 'assets/classes/eniripsa.png'},
  { id: 'enutrof',     name: 'Enutrof',     image: 'assets/classes/enutrof.png'},
  { id: 'feca',        name: 'Féca',        image: 'assets/classes/feca.png'},
  { id: 'huppermage',  name: 'Huppermage',  image: 'assets/classes/huppermage.png'},
  { id: 'iop',         name: 'Iop',         image: 'assets/classes/iop.png'},
  { id: 'osamodas',    name: 'Osamodas',    image: 'assets/classes/osamodas.png'},
  { id: 'ouginak',     name: 'Ouginak',     image: 'assets/classes/ouginak.png'},
  { id: 'pandawa',     name: 'Pandawa',     image: 'assets/classes/pandawa.png'},
  { id: 'roublard',    name: 'Roublard',    image: 'assets/classes/roublard.png'},
  { id: 'sacrieur',    name: 'Sacrieur',    image: 'assets/classes/sacrieur.png'},
  { id: 'sadida',      name: 'Sadida',      image: 'assets/classes/sadida.png'},
  { id: 'sram',        name: 'Sram',        image: 'assets/classes/sram.png'},
  { id: 'steamer',     name: 'Steamer',     image: 'assets/classes/steamer.png'},
  { id: 'xelor',       name: 'Xelor',       image: 'assets/classes/xelor.png'},
  { id: 'zobal',       name: 'Zobal',       image: 'assets/classes/zobal.png'},
];
