terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "6.27.0"
    }
  }

  backend "remote" {
    organization = "hatohui" 

    workspaces { 
      name = "yaoyao" 
    } 
  }
}