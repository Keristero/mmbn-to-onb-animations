### expected folder structure

BN All Sprites/
    game_name/
        pl/ (player)
        psl/ (effect)
        set/ (overword set pieces)
        em/ (enemies)
        bs/ (bosses)
        shl/ (effect)
        efc/ (effect)
        man/ (character overworld sprites)
        fac/ (faces/mugshots)
        icn/ (user interface)

### animation folder structure
    id/
        animations.xml
        objectLists.xml
        subAnims.xml

### animations.xml
```js
{
    Children:[
        Animation0:{
            Loop:"True",
            Children:[
                {
                    Tileset:0,//Animation state index
                    Palette:0,//palette folder to use (0 for root)
                    SubAnim:0,//Total frame index (all animation states)
                    ObjectList:0,
                    FrameDelay:9// x number of frames to display for
                }
            ]
        }
    ]
}