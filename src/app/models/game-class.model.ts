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

/** Represents a Wakfu PvP map */
export interface GameMap {
  id: string;
  name: string;
  image: string;
  fullImage: string;
}

/** The 12 Wakfu PvP maps */
export const WAKFU_MAPS: GameMap[] = [
  { id: 'map1',  name: 'Carte 1',  image: 'assets/maps/mini_map/map1.png',  fullImage: 'assets/maps/full_map/map1.png' },
  { id: 'map2',  name: 'Carte 2',  image: 'assets/maps/mini_map/map2.png',  fullImage: 'assets/maps/full_map/map2.png' },
  { id: 'map3',  name: 'Carte 3',  image: 'assets/maps/mini_map/map3.png',  fullImage: 'assets/maps/full_map/map3.png' },
  { id: 'map4',  name: 'Carte 4',  image: 'assets/maps/mini_map/map4.png',  fullImage: 'assets/maps/full_map/map4.png' },
  { id: 'map5',  name: 'Carte 5',  image: 'assets/maps/mini_map/map5.png',  fullImage: 'assets/maps/full_map/map5.png' },
  { id: 'map6',  name: 'Carte 6',  image: 'assets/maps/mini_map/map6.png',  fullImage: 'assets/maps/full_map/map6.png' },
  { id: 'map7',  name: 'Carte 7',  image: 'assets/maps/mini_map/map7.png',  fullImage: 'assets/maps/full_map/map7.png' },
  { id: 'map8',  name: 'Carte 8',  image: 'assets/maps/mini_map/map8.png',  fullImage: 'assets/maps/full_map/map8.png' },
  { id: 'map9',  name: 'Carte 9',  image: 'assets/maps/mini_map/map9.png',  fullImage: 'assets/maps/full_map/map9.png' },
  { id: 'map10', name: 'Carte 10', image: 'assets/maps/mini_map/map10.png', fullImage: 'assets/maps/full_map/map10.png' },
  { id: 'map11', name: 'Carte 11', image: 'assets/maps/mini_map/map11.png', fullImage: 'assets/maps/full_map/map11.png' },
  { id: 'map12', name: 'Carte 12', image: 'assets/maps/mini_map/map12.png', fullImage: 'assets/maps/full_map/map12.png' },
];

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
