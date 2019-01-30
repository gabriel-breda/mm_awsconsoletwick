Greasemonkey / Tampermonkey script to switch more easily between queue in the QWS SQS console

Install Tampermonkey chrone extension from here:
https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en

Then head to github: https://github.com/gabriel-breda/mm_awsconsoletwick/blob/master/mm_awsconsole.user.js
Click the 'RAW' button so that github lets you see the file normally, Chrome/Tampermonkey should recognize it as a user script
Install it (press install button)
Make sure it is only activated on the SQS console (url: https://eu-west-1.console.aws.amazon.com/sqs/home?region=eu-west-1 currently)

How to use:
- when first loading, all queues are shown, at least the first page of them
- double click on a queue name, so that it gets highlighted (standard chrome feature)
- first custom event copies any highlighted text starting with MM_ into the filtering text box at the top and trigger a keyup event to refresh the page:
the page now only shows the queue names starting with the name you selected
- click then on the queue type (facts, or background_low_priority, etc..) within the text box: a context menu appears with names of other types of queue.
CLick on one and it exchange the current type in the textbox with the type you have clicked on
- click on the environment name (production, demo, uat4, local_tim...) on the text box and again a menu appears to switch it to any other environment name
- if you don't want to use the context menu, press any key (like arrow right) and the context menu disappears

