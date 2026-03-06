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
    scene.apiBaseUrl = "https://music.aiacopilot.com/api/v1/roku/F8TYOyHl9s-csaWT7YDee6DLo00WlLaQKab5acM6kwo"
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
