import './style.css'; import { Game } from './game/Game';
const canvas = document.querySelector<HTMLCanvasElement>('#game'); const ui = document.querySelector<HTMLElement>('#ui'); if (!canvas || !ui) throw new Error('Missing game roots'); new Game(canvas, ui).start();
