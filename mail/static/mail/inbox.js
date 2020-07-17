document.addEventListener('DOMContentLoaded', function() {
  console.log('hello');
  // let mailbox = 'inbox';

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());
  
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(email) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  if(email != null){
    document.querySelector('#compose-recipients').value = email.sender;
    if (email.subject.slice(0, 3) != "Re:"){
      document.querySelector('#compose-subject').value = "Re: ";
    };
    divider = "------------------------------------------------------------------------";
    document.querySelector('#compose-subject').value += email.subject;
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:\n\n${email.body}\n${divider}\n`;
  }

  document.querySelector('#compose-message').style.display = 'none';
  document.querySelector('#compose-error').style.display = 'none';

  document.querySelector('#compose-form').onsubmit = function() {
    console.log('in compose');
    fetch('emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })  
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
      message = result.message;
      error = result.error;
      element_message = document.querySelector('#compose-message');
      element_error = document.querySelector('#compose-error');
      if (message != undefined){
        element_message.innerHTML = message;
        element_message.style.display = 'block';
        load_mailbox('sent');
      }
      if (error != undefined){
        element_error.innerHTML = error;
        element_error.style.display = 'block'
      }
    })
    .catch(error => {
      console.log("Error: ", error);
     });


    return false;
  }

}

function load_mailbox(mailbox) {
  console.log('in mailbox');
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // load e-mails
  fetch('emails/' + mailbox)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);

    emails.forEach(email => {
      const entry = document.createElement('div');
      const subject = document.createElement('span');
      const sender = document.createElement('span');
      const timestamp = document.createElement('span');
      
      entry.className = 'email';
      subject.className = 'email-subject';
      sender.className = 'email-sender';
      timestamp.className = 'email-timestamp';
      
      subject.innerHTML = email.subject;
      sender.innerHTML = email.sender;
      timestamp.innerHTML = email.timestamp;
      
      entry.append(sender);
      entry.append(subject);
      entry.append(timestamp);

      if (email.read == true){
        entry.style.backgroundColor = "lightgray";
      }

      entry.addEventListener('click', () => {
        load_email(email.id)
      });

      document.querySelector('#emails-view').append(entry);
    });
  });


}

function load_email(id){
  console.log('in email');
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  email_view = document.querySelector('#email-view');
  email_view.style.display = 'block';
  email_view.innerHTML = '';
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    data = email;
    details = document.createElement('div');
    details.className = 'email-details';

    from = document.createElement('div');
    span_from_label = document.createElement('span');
    span_from_label.className = 'detail-label';
    span_from_label.innerHTML = 'From: ';
    from.append(span_from_label);
    from.append(email.sender);

    to = document.createElement('div');
    span_to_label = document.createElement('span');
    span_to_label.className = 'detail-label';
    span_to_label.innerHTML = 'To: ';
    to.append(span_to_label);
    to.append(email.recipients);

    subject = document.createElement('div');
    span_subject_label = document.createElement('span');
    span_subject_label.className = 'detail-label';
    span_subject_label.innerHTML = 'Subject: ';
    subject.append(span_subject_label);
    subject.append(email.subject);

    ts = document.createElement('div');
    span_ts_label = document.createElement('span');
    span_ts_label.className = 'detail-label';
    span_ts_label.innerHTML = 'Timestamp: ';
    ts.append(span_ts_label);
    ts.append(email.timestamp);

    details.append(from);
    details.append(to);
    details.append(subject);
    details.append(ts);

    body = document.createElement('div');
    body.className = 'email-body';
    body.innerHTML = email.body.split('\n').join('<br>');
    

    reply = document.createElement('button');
    reply.className = 'btn btn-outline-primary btn-sm';
    reply.innerHTML = "Reply";

    archive = document.createElement('button');
    archive.className = 'btn btn-outline-primary btn-sm';
    if(email.archived === true){
      archive.innerHTML = 'Unarchive';
    } else {
      archive.innerHTML = 'Archive';
    };

    details.innerHTML += "<br>";
    details.append(reply);
    details.append('    ');
    details.append(archive);

    email_view.append(details);
    email_view.append(body);

    if(email.read != true){
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      })
    }

    archive.addEventListener('click', () => {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: !email.archived
        })
      })
      setTimeout(load_mailbox, 1000, 'inbox');
    })

    reply.addEventListener('click', () => compose_email(email));

  })
}
