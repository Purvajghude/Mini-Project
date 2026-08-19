package com.meshconnect.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * The packaged jar serves the React client from its static resources. Spring resolves
 * "/" to index.html on its own, but a client-side path typed directly or reloaded in the
 * browser would otherwise 404, because no such file exists on disk. Forwarding those
 * paths hands the request back to index.html and lets the client render the right view.
 *
 * <p>Deliberately an explicit list rather than a catch-all: a catch-all would swallow
 * genuine 404s from mistyped API paths and make them much harder to debug.
 */
@Controller
public class SpaForwardingController {

    @GetMapping({"/discover", "/matches", "/feed", "/profile", "/admin"})
    public String forwardToClient() {
        return "forward:/index.html";
    }
}
