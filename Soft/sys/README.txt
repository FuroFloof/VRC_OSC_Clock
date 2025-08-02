What do these files mean?


- S_O_B

"Start On Boot" 
This file signals the AUTORUN.exe that you would like to run the RUN_OSC.exe Whenever you launch windows!

- S_O_VRC

"Start On VRChat"
This file signals the AUTORUN.exe that you would like to run RUN_OSC.exe Whenever VRChat Launches.

If Both Files are Present, RUN_OSC.exe will Not be launched Twice.

If Only S_O_B is present, Launching the App Manually, will terminate the automatically Started Process.
Once the manually started process stops, it will re-start the automatically started Process.

If Only S_O_VRC is present, it will always wait for VRChat to Launch, before launching RUN_OSC.exe!

If Neither Files are Present (you Picked No for both options in the setup), then RUN_OSC.exe will never launc,
and You will have to manually start the program every time you launch VRChat.


To Remove The AUTORUN.exe From the List of programs that run when your PC Starts, 
press WIN+R and type "shell:startup" then press enter.
Delete "OSC_STARTUP.vsb" from the list of files.

You can at all times re-add it, by Deleting "SETUP_DONE" from this folder, and Starting RUN_OSC.exe



-FuroFloof-6.6.25@22:01