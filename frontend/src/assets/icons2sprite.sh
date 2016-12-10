NUMICONS=20

# loop over each icon and crop it from 200x200 to 170x170 then create a darkened
# copy of the cropped image to represent the icon's "off" state
for ICON in icon-*.png
do
	# crop "on" image from 200x200 to 170x170
	convert "$ICON" -gravity center -crop 170x170+0+0 "cropped-on-$ICON"

	# create a "off" version of the image by darkening the "on" version
	convert "cropped-on-$ICON" -fill black -colorize 53% "cropped-off-$ICON"
done

for ICON in notif-*.png
do
    # crop notif icons from 200x200 170x170
    convert "$ICON" -gravity center -crop 170x170+0+0 "cropped-$ICON"
done

# combine both "on" and "off" icons into single spritesheet with the "on" icons
# at the stop of the spritesheet
ICONS="cropped-on-*.png cropped-notif-success.png cropped-notif-info.png cropped-off-*.png cropped-notif-alert.png cropped-notif-fatal.png"
montage $ICONS -tile $NUMICONS -geometry 170x170+0+0 -background transparent sprite@170px.png

# create some resized versions of the sprite
convert sprite@170px.png -resize 50% sprite@85px.png

# set colorspace to RGB instead of Grayscale
convert sprite@170px.png -type TrueColorMatte -define png:color-type=6 sprite@170px.png
convert sprite@85px.png -type TrueColorMatte -define png:color-type=6 sprite@85px.png

# remove temporary cropped images
rm cropped-on-*.png
rm cropped-off-*.png
rm cropped-notif-*.png
