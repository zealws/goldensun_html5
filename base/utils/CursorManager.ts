const WIGGLE_KEY = "wiggle"
const WIGGLE_X1 = -4;
const WIGGLE_Y1 = +4;
const WIGGLE_X2 = -8;
const WIGGLE_Y2 = 0;

const POINT_KEY = "point"
const POINT_X = -6;
const POINT_Y = 6;

const TWEEN_TIME = Phaser.Timer.QUARTER >> 1;
const MOVE_TIME = Phaser.Timer.QUARTER >> 1;

export class CursorManager{
    public game:Phaser.Game;
    public group:Phaser.Group;
    public cursor:Phaser.Sprite;

    public active_tween:Phaser.Tween;
    public current_tween:string;
    public cursor_default_pos:{x:number, y:number};

    constructor(game){
        this.game = game;

        this.group = this.game.add.group();
        this.group.visible = false;
        this.group.x = 0;
        this.group.y = 0;
        this.cursor = this.group.create(0, 0, "cursor");
        this.active_tween = null;
        this.current_tween = null;
        this.cursor_default_pos = {x: 0, y: 0};
    }

    clear_tweens(){
        if(this.active_tween) this.game.tweens.remove(this.active_tween);
        this.active_tween = null;

        this.cursor.x = this.cursor_default_pos.x;
        this.cursor.y = this.cursor_default_pos.y;
    }

    init_tween(type:string){
        this.clear_tweens();
        if(!this.group.visible) this.show();

        switch(type){
            case WIGGLE_KEY:
                this.active_tween = this.game.add.tween(this.cursor)
                .to({ x: this.cursor.x + WIGGLE_X1, y: this.cursor.y + WIGGLE_Y1 }, TWEEN_TIME, Phaser.Easing.Linear.None)
                .to({ x: this.cursor.x + WIGGLE_X2, y: this.cursor.y + WIGGLE_Y2 }, TWEEN_TIME, Phaser.Easing.Linear.None)
                .to({ x: this.cursor.x + WIGGLE_X1, y: this.cursor.y + WIGGLE_Y1 }, TWEEN_TIME, Phaser.Easing.Linear.None)
                .to({ x: this.cursor.x, y: this.cursor.y}, TWEEN_TIME, Phaser.Easing.Linear.None).loop();
                break;
            case POINT_KEY:
                this.active_tween = this.game.add.tween(this.cursor)
                .to({ x: this.cursor.x + POINT_X, y: this.cursor.y + POINT_Y }, TWEEN_TIME, Phaser.Easing.Linear.None)
                .to({ x: this.cursor.x, y: this.cursor.y}, TWEEN_TIME, Phaser.Easing.Linear.None).loop();
        }

        this.current_tween = type;
        if(this.active_tween) this.active_tween.start();
    }

    move_to(new_x:number, new_y:number, tween_type?:string, animate:boolean=true){
        if(!this.group.visible) this.show();

        this.cursor_default_pos = {x: new_x + this.game.camera.x, y: new_y + this.game.camera.y};
        this.game.world.bringToTop(this.cursor.parent);

        if(animate){
            let t = this.game.add.tween(this.cursor).to(
                {x: new_x + this.game.camera.x, y: new_y + this.game.camera.y},
                MOVE_TIME,
                Phaser.Easing.Linear.None,
                true
            )
            if(tween_type !== undefined){
                t.onComplete.addOnce(this.init_tween.bind(this,tween_type),this);
            }
        }
        else{
            this.cursor.x = new_x + this.game.camera.x;
            this.cursor.y = new_y + this.game.camera.y;

            if(tween_type !== undefined) this.init_tween(tween_type);
        }
    }

    hide(){
        this.group.visible = false;
    }

    show(){
        this.group.visible = true;
    }

    destroy(){
        this.group.remove(this.cursor, true);
        this.group = null;
        this.cursor = null;
        this.active_tween = null;
    }
    
}