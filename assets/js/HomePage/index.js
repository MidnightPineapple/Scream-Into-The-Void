Vue.v_events = {
    RECEIVED_MESSAGE: "message",
}

Vue.component('text-entry', {
    template:`
    <div class="form-wrapper">
        <form @submit.prevent="onSubmit" >
            <input type="text" ref="input" v-model="message" class = "animated slow" :disabled="disabled"/>
            <button type="submit" :disabled="disabled">Scream Into The Void</button>
        </form>
    </div>`,
    data: () => ({
        message: "",
        disabled: false,
    }),
    props: ["screenName"],
    methods: {
        onSubmit: function() {
            if(this.message === "") return;

            // animate.css zoomOut transition
            this.$refs.input.className+=" zoomOut"

            // toggle loading state and disable inputs when loading
            var toggleLoading = (function() { 
                this.disabled = !this.disabled
                this.$root.loading = !this.$root.loading 
            }).bind(this)
            toggleLoading()
            
            var message = {
                message: this.message,
                screenName: this.screenName,
            }

            // Send a Message API request to create a new message 
            fetch("/message", {
                method:"POST", 
                headers:{
                    "Content-Type":"application/json",
                },
                body:JSON.stringify(message)
            }).then(toggleLoading)
            
            // Emit an event to the parent Vue element to notify that a message has been submitted
            this.$emit(Vue.v_events.RECEIVED_MESSAGE, message)

            // Make the input box reappear
            setTimeout((function(){
                this.message = "";
                this.$refs.input.className = this.$refs.input.className.replace(/ zoomOut/g, " fadeIn");
                setTimeout((function() {
                    this.$refs.input.className = this.$refs.input.className.replace(/ fadeIn/g, "");
                }).bind(this), 2000)
            }).bind(this), 2000)
            
        }
    },
    mounted: function() { this.$refs.input.focus(); }
})

Vue.component("message-row", {
    template:`
        <li>{{ message.message }}</li>`,
    props:[ "message" ],
})

Vue.component("message-display", {
    template:`
    <div class="message-display-wrapper">
        <ul class="message-display-modal" ref="modal">
            <message-row
            v-for="(message,index) in messages" 
            :message="message"
            :key="index" />
        </ul>
        <button @click="toggleActive">{{ active?"ignore":"listen to" }} echoes of the void...</button>
    </div>`,
    props: [ "messages" ],
    data: () => ({
        active:false
    }),
    methods: {
        toggleActive: function() {
            this.active = !this.active;
            if(this.active) {
                this.$refs.modal.className+=" modal-active"
            } else {
                this.$refs.modal.className = this.$refs.modal.className.replace(/ modal-active/g, "")
            }
        }
    }
})

Vue.component("particles-js", {
    template:`<div id="particles-js"></div>`,
    mounted: function() {
        particlesJS.load('particles-js', 'json/particles.json')
    }
})

var app = new Vue({ 
    el:"#app",
    data:{
        messages:[],
        loading: false,
        screenName: "anon",
    },
    methods: {
        onMessage: function(msg) {
            this.messages.unshift({ ...msg, sent:false } );
        },
    },
    created: function() {
        this.loading = true;

        // Getting Initial Messages
        fetch("/message").then(function(res){ return res.json() })
        .then((function(res) { 
            this.messages = res.reverse(); 
            this.loading = false;
        }).bind(this))

        // Subscribe to the message-feed room in Socket.io 
        io.socket.get("/message/subscribe", (function(res){
            io.socket.on("new-message", (function(res) {
                // set listener for new-message events
                var match = this.messages.find( m => m.message === res.message && m.screenName === res.screenName && m.sent === false)
                if(match) {
                    match.sent = true;
                } else {
                    // if we haven't seen this message yet, push it onto the array of messages
                    this.messages.unshift({ ...res, sent:true })
                }
            }).bind(this))
        }).bind(this))
    }
})