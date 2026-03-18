/** Represents a Wakfu class definition */
export interface GameClass {
  id: string;
  name: string;
  image: string;
  /** Accent color used for UI highlighting */
  color: string;
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
}

/** The 18 Wakfu classes with placeholder images */
export const WAKFU_CLASSES: GameClass[] = [
  { id: 'feca',        name: 'Féca',        image: 'assets/classes/feca.svg',        color: '#4a90e2' },
  { id: 'osamodas',    name: 'Osamodas',    image: 'assets/classes/osamodas.svg',    color: '#27ae60' },
  { id: 'enutrof',     name: 'Enutrof',     image: 'assets/classes/enutrof.svg',     color: '#f39c12' },
  { id: 'sram',        name: 'Sram',        image: 'assets/classes/sram.svg',        color: '#8e44ad' },
  { id: 'xelor',       name: 'Xelor',       image: 'assets/classes/xelor.svg',       color: '#2980b9' },
  { id: 'ecaflip',     name: 'Ecaflip',     image: 'assets/classes/ecaflip.svg',     color: '#e74c3c' },
  { id: 'eniripsa',    name: 'Eniripsa',    image: 'assets/classes/eniripsa.svg',    color: '#1abc9c' },
  { id: 'iop',         name: 'Iop',         image: 'assets/classes/iop.svg',         color: '#e67e22' },
  { id: 'cra',         name: 'Cra',         image: 'assets/classes/cra.svg',         color: '#16a085' },
  { id: 'sadida',      name: 'Sadida',      image: 'assets/classes/sadida.svg',      color: '#2ecc71' },
  { id: 'sacrieur',    name: 'Sacrieur',    image: 'assets/classes/sacrieur.svg',    color: '#c0392b' },
  { id: 'pandawa',     name: 'Pandawa',     image: 'assets/classes/pandawa.svg',     color: '#3498db' },
  { id: 'roublard',    name: 'Roublard',    image: 'assets/classes/roublard.svg',    color: '#95a5a6' },
  { id: 'zobal',       name: 'Zobal',       image: 'assets/classes/zobal.svg',       color: '#9b59b6' },
  { id: 'foggernaut',  name: 'Foggernaut',  image: 'assets/classes/foggernaut.svg',  color: '#7f8c8d' },
  { id: 'eliotrope',   name: 'Éliotrope',   image: 'assets/classes/eliotrope.svg',   color: '#d35400' },
  { id: 'huppermage',  name: 'Huppermage',  image: 'assets/classes/huppermage.svg',  color: '#8e44ad' },
  { id: 'ouginak',     name: 'Ouginak',     image: 'assets/classes/ouginak.svg',     color: '#795548' },
];
