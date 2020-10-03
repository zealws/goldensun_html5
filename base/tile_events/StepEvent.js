import { directions } from "../utils.js";
import { TileEvent, event_types } from "./TileEvent.js";

const STEP_SHIFT_FACTOR = 4;

export class StepEvent extends TileEvent {
    constructor(game, data, x, y, activation_directions, activation_collision_layers, dynamic, active, step_direction) {
        super(game, data, event_types.STEP, x, y, activation_directions, activation_collision_layers, dynamic, active, null);
        this.step_direction = step_direction;
        this.next_x = 0;
        this.next_y = 0;
        this.shift_y = 0;
    }

    set() {
        let next_x, next_y = this.y, shift_y;
        if (this.step_direction === directions.up) {
            shift_y = -((this.data.map.sprite.tileHeight/STEP_SHIFT_FACTOR) | 0);
        } else if (this.step_direction === directions.down) {
            shift_y = (this.data.map.sprite.tileHeight/STEP_SHIFT_FACTOR) | 0;
        }
        if (this.activation_directions[0] === directions.left) {
            next_x = this.x - 1;
        } else if (this.activation_directions[0] === directions.right) {
            next_x = this.x + 1;
        }
        this.next_x = next_x;
        this.next_y = next_y;
        this.shift_y = shift_y;
        this.data.tile_event_manager.set_triggered_event(this);
    }
    
    fire() {
        if (this.data.hero.tile_x_pos === this.next_x && this.data.hero.tile_y_pos === this.next_y) {
            this.data.tile_event_manager.unset_triggered_event(this);
            this.data.hero.sprite.body.y += this.shift_y;
        } else if (!this.check_position()) {
            this.data.tile_event_manager.unset_triggered_event(this);
        }
    }
}