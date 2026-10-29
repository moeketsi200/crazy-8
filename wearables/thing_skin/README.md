# Thing full-body wearable

These are upload-ready Decentraland **Skin** wearable models. A Skin replaces the avatar’s whole body, so this turns the avatar into Thing instead of attaching a small hand to its head.

## Files

- `Thing_Skin_Male.glb` — Shape A rig
- `Thing_Skin_Female.glb` — Shape B rig
- `Thing_Skin_Preview.png` — static preview of the full-body model

Both models use the official 62-bone Decentraland avatar rig. The four long fingers are weighted to the avatar’s leg chains, the thumb follows an arm, and the palm follows the torso and head. Decentraland’s normal walking animation therefore moves the fingers as the avatar walks; the wearable does not include a separate animation clip.

## Shape and size

The palm and fingers are fused into one smooth skin surface, with visible flesh between the finger roots. The fingers fan outward instead of bending inward. Dark fingertip marks are removed; the Thing stitches remain on the back.

- 4,860 triangles
- 2 materials, no textures
- Approximately 2.35 m tall, 1.41 m wide, and 1.12 m deep
- Skin wearable limits: 5,000 triangles and maximum dimensions of 2.42 m tall/wide and 1.4 m deep

Both models use the required `AvatarSkin_MAT` material name and were rendered against their matching official avatar rigs. Their palm-and-finger shape was checked in Blender. Preview and validate the new GLBs in Decentraland Builder before publishing.

## Upload and equip

1. In Decentraland Builder, create or open a wearable collection and upload `Thing_Skin_Male.glb` as a **Skin** wearable for the male body shape.
2. Add `Thing_Skin_Female.glb` as the female representation of that same wearable.
3. Save, then equip Thing from the avatar editor/backpack.

This is a real avatar wearable, so it is equipped through Decentraland’s avatar tools. The Crazy 8 chip shop cannot apply a Skin wearable to a player’s avatar.

Reference: [Decentraland wearable creation guidelines](https://docs.decentraland.org/creator/wearables-and-emotes/wearables/creating-wearables/).
