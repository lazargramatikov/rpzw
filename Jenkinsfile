pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        echo 'hello'
        archiveArtifacts '*.nuspec'
        bat 'echo'
        stash(name: 'stash_packs', includes: '*.dll')
        node(label: 'allocate_node_laz') {
          echo 'blah-blah-blaaaaah'
        }
        
      }
    }
  }
}