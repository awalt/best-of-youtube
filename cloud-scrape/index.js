//These Google Cloud serverless functions scrape and run the LLM prompts to generate the list of top videos

const functions = require('@google-cloud/functions-framework');


const scrapeVideos = require("./scrapeVideos.js")
const generateDescriptions = require("./generateDescriptions.js")
const findTopVideos = require("./findTopVideos.js")


async function _genPrompts(req = false, res = false) {
    try {
        let results = await scrapeVideos();

        if (res)
            res.status(200).json({ results, message: 'Prompts generated and saved successfully' });
    } catch (err) {
        console.error('Error generating prompts:', err);
        if (res)
            res.status(500).send('Error generating prompts');
    }
}

functions.http('genPrompts', _genPrompts);

async function _runPrompts(req = false, res = false) {

    try {
        let results = await generateDescriptions();

        if (res) {
            res.status(200).json({ results, message: 'Video descriptions generated and saved successfully' });
        } else {
            return results;
        }
        console.log("all done")
    } catch (err) {
        console.error('Error generating Video descriptions:', err);
        if (res) {
            res.status(500).send('Error generating Video descriptions');
        } else {
            return results;
        }
        console.log("all done")
    }

}

functions.http('runPrompts', _runPrompts);

async function _runBOYT(req = false, res = false) {
    try {
        let results = await findTopVideos();
        console.log("done findTopVideos")
        if (res) {
            res.status(200).json({ results, message: 'Done successfully' });
        } else {
            return results;
        }


    } catch (err) {
        console.error('Error generating BOYT', err);
        if (res) {
            res.status(500).send('Error generating BOYT');

        }
        else {
            return results;
        }
    }
}
functions.http('runBOYT', _runBOYT);


let isLocal = (process.env.COMPUTERNAME == 'JUPITER');
if (isLocal) {
    async function _run() {
        // Run the function locally
        let run = 4;

        if (run == 1 || run == 3)
            await _genPrompts();
        if (run == 2 || run == 3)
            await _runPrompts();

        if (run == 4) {
           
            await _runBOYT();
        }
        console.log("all done")
    }
    _run();


}

functions.http('helloWorld', (req, res) => {
    res.send('Hello, World!');
});

//gcloud functions deploy genPrompts --gen2 --runtime=nodejs20 --region=us-central1 --source=. --entry-point=genPrompts --trigger-http --project secret-descent-94518 --timeout=220s --max-instances=2 --allow-unauthenticated
//gcloud functions deploy runPrompts --gen2 --runtime=nodejs20 --region=us-central1 --source=. --entry-point=runPrompts --trigger-http --project secret-descent-94518 --timeout=220s --max-instances=3 --allow-unauthenticated
//gcloud functions deploy runBOYT --gen2 --runtime=nodejs20 --region=us-central1 --source=. --entry-point=runBOYT --trigger-http --project secret-descent-94518 --timeout=60s --max-instances=1 --allow-unauthenticated

//gcloud functions deploy helloWorld --runtime nodejs20 --trigger-http --allow-unauthenticated --gen2 --project secret-descent-94518 --region=us-central1

//  gcloud alpha functions local deploy helloWorld --entry-point=helloWorld --runtime=nodejs20
// npx functions-framework --target=helloWorld