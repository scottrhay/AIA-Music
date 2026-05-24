' AIA Music Roku Player - Main Entry Point
' Simple player-only MVP: select playlist, play through songs

sub Main()
    ' Initialize screen
    screen = CreateObject("roSGScreen")
    m.port = CreateObject("roMessagePort")
    screen.setMessagePort(m.port)
    
    ' Create scene and set as root
    scene = screen.CreateScene("MainScene")
    screen.show()
    
    ' API configuration - Using Roku public endpoint (no OAuth required)
    ' Do not commit the live Roku secret. Replace this placeholder during packaging.
    scene.apiBaseUrl = "https://music.aiacopilot.com/api/v1/roku/REPLACE_WITH_ROKU_SECRET_KEY"
    scene.authToken = "roku"  ' Not used for Roku endpoints, but kept for compatibility
    
    ' Event loop
    while(true)
        msg = wait(0, m.port)
        msgType = type(msg)
        
        if msgType = "roSGScreenEvent"
            if msg.isScreenClosed()
                return
            end if
        end if
    end while
end sub
