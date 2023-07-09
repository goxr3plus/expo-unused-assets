# expo-unused-assets
Check react native expo project for unused assets

How to run: ```node unusedAssets.js```

I created this because inside the expo assets folder i have lots of images or lottie json files which i forget to delete and for my surprise after running this code i found 8 Mb of unused images and Lottie Json.

![image](https://github.com/goxr3plus/expo-unused-assets/assets/20374208/82fbf2c7-133a-43bd-bb3b-d74a0ed55bca)


You need to have Node.js installed in your computer ( i tested with node 18.0.0)

It scans the assets folder for images or lottie files that are not being ( imported or require('...') ) inside the .js files in the src folder . If it finds it asks you if you want to delete them .

--------

Examples screenshots :

> No unused assets found

![image](https://github.com/goxr3plus/expo-unused-assets/assets/20374208/0a24b086-8513-4942-b3c5-12bd882b18d6)

> Some unused assets found 

![image](https://github.com/goxr3plus/expo-unused-assets/assets/20374208/7c42fb05-9c22-4756-a22c-4d4bb6466637)



