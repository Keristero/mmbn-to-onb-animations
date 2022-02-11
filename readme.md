### expected folder structure

BN All Sprites/
    game_name/
        pl/ (player)
        psl/ (battle_effects)
        set/ (overword set pieces)
        em/ (enemies)
        bs/ (bosses)
        shl/ (battle_effects)
        efc/ (battle_effects)
        man/ (character overworld sprites)
        fac/ (faces/mugshots)
        icn/ (user interface)

### animation folder structure
    id/
        animations.xml
        objectLists.xml
        subAnims.xml

### animations.xml
this file lists all the animations, and the delays between each frame of each animation
```js
{
    Children:[
        Animation0:{
            Loop:"True",
            Children:[
                {
                    Tileset:0,//Animation state index
                    Palette:0,//palette folder to use (0 for root)
                    SubAnim:0,//Describes which sub animation to use, and in turn which object to use
                    ObjectList:0,//I think we can ignore this
                    FrameDelay:9// x number of frames to display for
                }
            ]
        }
    ]
}
```

### objectLists.xml
this file decribes how 'objects' aka animation frames are made up from tiles, the positions are relative to the origin, so I need to work out where the origin is based on how the image is.

```js
    Children:[
        ObjectList0:{
            Children:[
                {
                    Tileset:0,//Animation state index
                    Palette:0,//palette folder to use (0 for root)
                    SubAnim:0,//Describes which sub animation to use, and in turn which object to use
                    ObjectList:0,//I think we can ignore this
                    FrameDelay:9// x number of frames to display for
                }
            ]
        }
    ]
```


### subAnims.xml
this file lists something, but it does not seem important for the vast majority of animations