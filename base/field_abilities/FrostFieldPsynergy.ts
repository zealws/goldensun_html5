import * as numbers from '../magic_numbers';
import { get_surroundings, directions} from "../utils";
import { JumpEvent } from "../tile_events/JumpEvent";
import { FieldAbilities } from "./FieldAbilities";
import * as _ from "lodash";

const ABILITY_KEY_NAME = "frost";
const ACTION_KEY_NAME = "cast";
const FROST_MAX_RANGE = 12;
const SNOWFLAKES_COUNT = 16;
const TOTAL_TURNS_SNOWFLAKES = Math.PI * 7;
const POLAR_SLOPE = 0.15;
const SPIRAL_INTENSITY = 8;
const SNOWFLAKE_DURATION = 1650;

/*Handles the "Frost" field psynergy
Does not handle the in-battle command

Input:game [Phaser:Game] - Reference to the running game object
       data [GoldenSun] - Reference to the main JS Class instance*/
export class FrostFieldPsynergy extends FieldAbilities {
    constructor(game, data) {
        super(game, data, ABILITY_KEY_NAME, FROST_MAX_RANGE, ACTION_KEY_NAME, true);
        this.set_bootstrap_method(this.init_snowflakes.bind(this));
    }

    /*Begins the snowflake effects
    Upon finishing, triggers the pillar's growth*/
    init_snowflakes() {
        this.field_psynergy_window.close();
        for (let i = 0; i < SNOWFLAKES_COUNT; ++i) {
            let snowflake_sprite = this.data.overlayer_group.create(0, 0, "frost_snowflake");
            snowflake_sprite.anchor.setTo(0.5, 0.5);
            const scale_factor = _.random(5, 8)/10.0;
            const rotation_factor = Math.random() * numbers.degree360;
            snowflake_sprite.scale.setTo(scale_factor, scale_factor);
            snowflake_sprite.rotation = rotation_factor;
            let x_dest = this.controllable_char.sprite.centerX;
            let y_dest = this.controllable_char.sprite.centerY + 12;
            switch (this.cast_direction) {
                case directions.left: x_dest -= 16; break;
                case directions.right: x_dest += 16; break;
                case directions.up: y_dest -= 14; break;
                case directions.down: y_dest += 12; break;
            }
            let spiral_angle = {rad: TOTAL_TURNS_SNOWFLAKES};
            const sign_x = Math.sign(Math.random() - 0.5);
            const sign_y = Math.sign(Math.random() - 0.5);
            const tween = this.game.add.tween(spiral_angle).to(
                {rad: -Math.PI},
                SNOWFLAKE_DURATION,
                Phaser.Easing.Linear.None,
                true,
                i*(Phaser.Timer.QUARTER/5)
            );
            tween.onUpdateCallback(() => {
                snowflake_sprite.centerX = sign_x * SPIRAL_INTENSITY * Math.exp(POLAR_SLOPE * spiral_angle.rad) * Math.cos(spiral_angle.rad) + x_dest;
                snowflake_sprite.centerY = sign_y * SPIRAL_INTENSITY * Math.exp(POLAR_SLOPE * spiral_angle.rad) * Math.sin(spiral_angle.rad) + y_dest;
            });
            tween.onComplete.addOnce(() => {
                snowflake_sprite.destroy();
                if (i === SNOWFLAKES_COUNT - 1) {
                    if (this.target_found) {
                        this.init_pillar();
                    } else {
                        this.unset_hero_cast_anim();
                        this.stop_casting();
                    }
                }
            });
        }
    }

    /*Changes the pool into a pillar
    Will change its properties and animation*/
    init_pillar() {
        this.target_object.get_events().forEach((event: JumpEvent) => {
            if (event.is_set) {
                event.deactivate();
                event.is_set = false;
            } else {
                event.activate();
                event.is_set = true;
                JumpEvent.active_jump_surroundings(
                    this.data,
                    get_surroundings(event.x, event.y, false, 2),
                    this.target_object.collider_layer_shift + this.target_object.base_collision_layer
                );
            }
        });
        this.target_object.sprite.send_to_back = false;
        this.data.map.sort_sprites();
        this.target_object.custom_data.color_filters = this.game.add.filter('ColorFilters');
        this.target_object.sprite.filters = [this.target_object.custom_data.color_filters];
        let blink_counter = 16;
        let blink_timer = this.game.time.create(false);
        blink_timer.loop(50, () => {
            if (blink_counter%2 === 0) {
                this.target_object.custom_data.color_filters.tint = [1,1,1];
            } else {
                this.target_object.custom_data.color_filters.tint = [-1,-1,-1];
            }
            --blink_counter;
            if (blink_counter === 0) {
                blink_timer.stop();
                this.grow_pillar();
            }
        });
        blink_timer.start();
    }

    /*Plays the pillar's growing animation*/
    grow_pillar() {
        this.target_object.sprite.animations.play("frost_pool_pillar");
        this.target_object.sprite.animations.currentAnim.onComplete.addOnce(() => {
            this.set_permanent_blink();
            this.unset_hero_cast_anim();
            this.stop_casting();
        });
    }

    /*Enables the pillar's blinking state*/
    set_permanent_blink() {
        let blink_timer = this.game.time.create(false);
        let target_object = this.target_object;
        blink_timer.loop(150, () => {
            target_object.custom_data.color_filters.hue_adjust = 5.3;
            this.game.time.events.add(20, () => {
                target_object.custom_data.color_filters.hue_adjust = 0;
            });
        });
        blink_timer.start();
        target_object.sprite.events.onDestroy.add(() => {
            blink_timer.destroy();
        });
    }
}