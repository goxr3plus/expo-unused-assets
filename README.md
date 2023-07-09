# expo-unused-assets
Check react native expo project for unused assets

How to run: ```node unusedAssets.js```

I created this because inside the expo assets folder i have lots of images or lottie json files which i forget to delete and for my surprise after running this code i found 8 Mb of unused images and Lottie Json.

![image](https://github.com/goxr3plus/expo-unused-assets/assets/20374208/82fbf2c7-133a-43bd-bb3b-d74a0ed55bca)


You need to have Node.js installed in your computer ( i tested with node 18.0.0)

It scans the assets folder for images or lottie files that are not being ( imported or require('...') ) inside the .js files in the src folder . If it finds it asks you if you want to delete them .

Example screenshot :



![image](https://github.com/goxr3plus/expo-unused-assets/assets/20374208/3b4f5e52-7a38-4e93-af53-09a69edbe6c2)
